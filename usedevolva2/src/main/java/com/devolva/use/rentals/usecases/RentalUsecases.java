package com.devolva.use.rentals.usecases;

import com.devolva.use.rentals.domain.RentalModel;
import com.devolva.use.rentals.domain.RentalStatus;
import com.devolva.use.rentals.dtos.*;
import com.devolva.use.rentals.repository.RentalRepository;
import com.devolva.use.tools.domain.ToolImageModel;
import com.devolva.use.tools.domain.ToolModel;
import com.devolva.use.tools.repository.ToolImageRepository;
import com.devolva.use.tools.repository.ToolRepository;
import com.devolva.use.users.domain.UserModel;
import com.devolva.use.users.domain.UserStatus;
import com.devolva.use.users.repository.UserRepository;
import org.springframework.stereotype.Service;


import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class RentalUsecases {

    private static final BigDecimal SERVICE_FEE_PERCENT = new BigDecimal("0.07");
    private static final BigDecimal LATE_FEE_PERCENT_PER_DAY = new BigDecimal("0.20");

    private final RentalRepository rentalRepository;
    private final ToolRepository toolRepository;
    private final UserRepository userRepository;
    private final ToolImageRepository toolImageRepository;

    public RentalUsecases(
            RentalRepository rentalRepository,
            ToolRepository toolRepository,
            UserRepository userRepository,
            ToolImageRepository toolImageRepository
    ) {

        this.rentalRepository = rentalRepository;
        this.toolRepository = toolRepository;
        this.userRepository = userRepository;
        this.toolImageRepository = toolImageRepository;
    }

    private String getToolMainImage(Long toolId) {

        return toolImageRepository
                .findByToolId(toolId)
                .stream()
                .filter(ToolImageModel::isPrincipal)
                .findFirst()
                .map(ToolImageModel::getFilePath)
                .orElse(null);
    }


    public RentalDetailsDto getRentalDetails(
            Long rentalId,
            Long currentUserId
    ) {

        RentalModel rental = findRentalOrThrow(rentalId);

        ToolModel tool = findToolOrThrow(
                rental.getToolId()
        );

        UserModel owner = findUserOrThrow(
                rental.getOwnerId()
        );

        UserModel renter = findUserOrThrow(
                rental.getRenterId()
        );

        return new RentalDetailsDto(

                rental.getId(),

                tool.getId(),

                tool.getNome(),

                getToolMainImage(tool.getId()),

                owner.getId(),

                owner.getNomeCompleto(),

                renter.getId(),

                renter.getNomeCompleto(),

                rental.getStatus().name(),

                rental.getStartDate().toString(),

                rental.getEndDate().toString(),

                rental.getTotalValue(),

                owner.getId().equals(currentUserId),

                renter.getId().equals(currentUserId)
        );
    }
    public RentalModel createRentalRequest(CreateRentalDto dto) {
        validateRentalDates(dto);

        ToolModel tool = findToolOrThrow(dto.toolId());
        UserModel tenant = findUserOrThrow(dto.tenantId());
        UserModel owner = findUserOrThrow(tool.getOwnerId());

        validateActiveUser(tenant, "Locatário");
        validateActiveUser(owner, "Proprietário");

        if (!tenant.isVerificado()) {
            throw new RuntimeException("O locatário precisa estar verificado para realizar transações.");
        }

        if (tool.getOwnerId() == null) {
            throw new RuntimeException("A ferramenta não possui proprietário vinculado.");
        }

        if (tool.getOwnerId().equals(tenant.getId())) {
            throw new RuntimeException("O usuário não pode alugar a própria ferramenta.");
        }

        if (!tool.isAtivo()) {
            throw new RuntimeException("A ferramenta está inativa.");
        }

        if (!tool.isDisponivel() || tool.isBloqueadaTemporariamente()) {
            throw new RuntimeException("A ferramenta não está disponível.");
        }

        long activeRequests = rentalRepository.findAll().stream()
                .filter(r -> r.getRenterId().equals(tenant.getId()))
                .filter(this::isActiveRentalFlow)
                .count();


        boolean hasConflict = rentalRepository.findAll().stream()
                .filter(r -> r.getToolId().equals(dto.toolId()))
                .filter(this::isActiveRentalFlow)
                .anyMatch(r -> hasDateConflict(dto.startDate(), dto.endDate(), r.getStartDate(), r.getEndDate()));

        if (hasConflict) {
            throw new RuntimeException("A ferramenta não está disponível para o período informado.");
        }

        long totalDays = ChronoUnit.DAYS.between(dto.startDate(), dto.endDate()) + 1;

        BigDecimal dailyRate = tool.getValorDiaria();
        BigDecimal baseValue = dailyRate.multiply(BigDecimal.valueOf(totalDays));
        BigDecimal serviceFee = calculateServiceFee(baseValue);
        BigDecimal totalValue = baseValue.add(serviceFee);

        RentalModel rental = new RentalModel();
        rental.setToolId(tool.getId());
        rental.setOwnerId(tool.getOwnerId());
        rental.setRenterId(tenant.getId());
        rental.setStartDate(dto.startDate());
        rental.setEndDate(dto.endDate());
        rental.setTotalDays((int) totalDays);
        rental.setDailyRate(dailyRate.doubleValue());
        rental.setBaseValue(baseValue.doubleValue());
        rental.setServiceFee(serviceFee.doubleValue());
        rental.setTotalValue(totalValue.doubleValue());
        rental.setOwnerNetValue(baseValue.doubleValue());
        rental.setStatus(RentalStatus.PENDING);

        return rentalRepository.save(rental);
    }

    public RentalModel approveOrRejectRental(Long rentalId, ApproveRentalDto dto) {
        RentalModel rental = findRentalOrThrow(rentalId);
        ToolModel tool = findToolOrThrow(rental.getToolId());

        if (!rental.getOwnerId().equals(dto.ownerId())) {
            throw new RuntimeException("Somente o proprietário pode aprovar ou recusar a solicitação.");
        }

        if (rental.getStatus() != RentalStatus.PENDING) {
            throw new RuntimeException("A solicitação já foi processada.");
        }

        if (!tool.isDisponivel() || tool.isBloqueadaTemporariamente()) {
            throw new RuntimeException("A ferramenta não está disponível para aprovação.");
        }

        boolean hasConflict = rentalRepository.findAll().stream()
                .filter(r -> !r.getId().equals(rental.getId()))
                .filter(r -> r.getToolId().equals(rental.getToolId()))
                .filter(this::isActiveRentalFlow)
                .anyMatch(r -> hasDateConflict(rental.getStartDate(), rental.getEndDate(), r.getStartDate(), r.getEndDate()));

        if (hasConflict) {
            throw new RuntimeException("Existe conflito de agenda para esta ferramenta.");
        }

        rental.setRespondedAt(LocalDateTime.now());

        if (Boolean.TRUE.equals(dto.approved())) {
            rental.setStatus(RentalStatus.ACCEPTED);

        } else {
            rental.setStatus(RentalStatus.REJECTED);
        }

        return rentalRepository.save(rental);
    }



    public RentalModel startRental(Long rentalId, StartRentalDto dto) {
        RentalModel rental = findRentalOrThrow(rentalId);
        ToolModel tool = findToolOrThrow(rental.getToolId());

        if (!rental.getOwnerId().equals(dto.ownerId())) {
            throw new RuntimeException("Somente o proprietário pode iniciar a locação.");
        }

        if (rental.getStatus() != RentalStatus.PAID) {
            throw new RuntimeException("A locação só pode ser iniciada após pagamento confirmado.");
        }

        rental.setStartedAt(LocalDateTime.now());
        rental.setStatus(RentalStatus.IN_USE);

        tool.setDisponivel(false);
        tool.setUpdatedAt(LocalDateTime.now());
        toolRepository.save(tool);

        return rentalRepository.save(rental);
    }

    public RentalModel returnRental(Long rentalId, ReturnRentalDto dto) {
        RentalModel rental = findRentalOrThrow(rentalId);
        ToolModel tool = findToolOrThrow(rental.getToolId());

        if (!rental.getOwnerId().equals(dto.ownerId())) {
            throw new RuntimeException("Somente o proprietário pode finalizar a devolução.");
        }

        if (rental.getStatus() != RentalStatus.IN_USE && rental.getStatus() != RentalStatus.PAID) {
            throw new RuntimeException("A locação não está em um estado válido para devolução.");
        }

        if (dto.actualReturnDate() == null) {
            throw new RuntimeException("A data real de devolução é obrigatória.");
        }

        rental.setActualReturnDate(dto.actualReturnDate());
        rental.setReturnedAt(LocalDateTime.now());

        if (dto.actualReturnDate().isAfter(rental.getEndDate())) {
            long lateDays = ChronoUnit.DAYS.between(rental.getEndDate(), dto.actualReturnDate());

            BigDecimal dailyRate = toBigDecimal(rental.getDailyRate());
            BigDecimal dailyLateFee = dailyRate.multiply(LATE_FEE_PERCENT_PER_DAY);
            BigDecimal lateFee = dailyLateFee.multiply(BigDecimal.valueOf(lateDays));

            rental.setLateFee(scale(lateFee).doubleValue());
            rental.setStatus(RentalStatus.LATE_RETURNED);
        } else {
            rental.setLateFee(0.0);
            rental.setStatus(RentalStatus.RETURNED);
        }

        tool.setDisponivel(true);
        tool.setUpdatedAt(LocalDateTime.now());
        toolRepository.save(tool);

        return rentalRepository.save(rental);
    }

    public List<RentalModel> findAll() {
        return rentalRepository.findAll();
    }

    public RentalModel findById(Long rentalId) {
        return findRentalOrThrow(rentalId);
    }

    public List<RentalModel> findByTenantId(Long tenantId) {
        return rentalRepository.findAll().stream()
                .filter(r -> r.getRenterId().equals(tenantId))
                .toList();
    }

    public List<RentalModel> findByOwnerId(Long ownerId) {
        return rentalRepository.findAll().stream()
                .filter(r -> r.getOwnerId().equals(ownerId))
                .toList();
    }

    private void validateRentalDates(CreateRentalDto dto) {
        if (dto.startDate() == null || dto.endDate() == null) {
            throw new RuntimeException("As datas de início e fim são obrigatórias.");
        }

        if (dto.startDate().isBefore(LocalDate.now())) {
            throw new RuntimeException("A data de início não pode estar no passado.");
        }

        if (dto.endDate().isBefore(dto.startDate())) {
            throw new RuntimeException("A data final não pode ser menor que a data inicial.");
        }
    }

    private ToolModel findToolOrThrow(Long toolId) {
        return toolRepository.findById(toolId)
                .orElseThrow(() -> new RuntimeException("Ferramenta não encontrada."));
    }

    private UserModel findUserOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado."));
    }

    private RentalModel findRentalOrThrow(Long rentalId) {
        return rentalRepository.findById(rentalId)
                .orElseThrow(() -> new RuntimeException("Locação não encontrada."));
    }

    private void validateActiveUser(UserModel user, String label) {
        if (user.getStatus() != UserStatus.ATIVO) {
            throw new RuntimeException(label + " não está ativo.");
        }
    }

    private boolean isActiveRentalFlow(RentalModel rental) {
        return rental.getStatus() == RentalStatus.PENDING
                || rental.getStatus() == RentalStatus.AWAITING_PAYMENT
                || rental.getStatus() == RentalStatus.PAID
                || rental.getStatus() == RentalStatus.IN_USE;
    }

    private boolean hasDateConflict(
            LocalDate requestedStart,
            LocalDate requestedEnd,
            LocalDate existingStart,
            LocalDate existingEnd
    ) {
        return !(requestedEnd.isBefore(existingStart) || requestedStart.isAfter(existingEnd));
    }
    private BigDecimal calculateServiceFee(BigDecimal baseValue) {
        return scale(baseValue.multiply(SERVICE_FEE_PERCENT));
    }

    private BigDecimal toBigDecimal(double value) {
        return BigDecimal.valueOf(value);
    }

    private BigDecimal scale(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    public List<RentalListDto> getRentalsByRenter(Long renterId) {

        List<RentalModel> rentals =
                rentalRepository.findAll().stream()
                        .filter(r -> r.getRenterId().equals(renterId))
                        .toList();

        return rentals.stream().map(rental -> {

            ToolModel tool =
                    findToolOrThrow(rental.getToolId());

            UserModel owner =
                    findUserOrThrow(rental.getOwnerId());

            String image = null;

            List<ToolImageModel> images =
                    toolImageRepository.findByToolId(tool.getId());

            if (!images.isEmpty()) {

                image = images.stream()
                        .filter(ToolImageModel::isPrincipal)
                        .findFirst()
                        .orElse(images.get(0))
                        .getFilePath();
            }

            return new RentalListDto(

                    rental.getId(),

                    tool.getId(),

                    tool.getNome(),

                    image,

                    owner.getNomeCompleto(),

                    rental.getStatus().name(),

                    rental.getStartDate().toString(),

                    rental.getEndDate().toString(),

                    rental.getTotalValue()
            );

        }).toList();
    }

    public List<RentalListDto> getRentalsByOwner(Long ownerId) {
        // Filtra apenas as locações onde o usuário é o proprietário
        List<RentalModel> rentals = rentalRepository.findAll().stream()
                .filter(r -> r.getOwnerId().equals(ownerId))
                .toList();

        return rentals.stream().map(rental -> {
            // Busca a ferramenta associada
            ToolModel tool = findToolOrThrow(rental.getToolId());
            // Busca o locatário para obter o nome completo
            UserModel renter = findUserOrThrow(rental.getRenterId());

            // Define a imagem principal da ferramenta
            String image = null;
            List<ToolImageModel> images = toolImageRepository.findByToolId(tool.getId());
            if (!images.isEmpty()) {
                image = images.stream()
                        .filter(ToolImageModel::isPrincipal)
                        .findFirst()
                        .orElse(images.get(0))
                        .getFilePath();
            }


            return new RentalListDto(
                    rental.getId(),
                    tool.getId(),
                    tool.getNome(),
                    image,
                    renter.getNomeCompleto(),
                    rental.getStatus().name(),
                    rental.getStartDate().toString(),
                    rental.getEndDate().toString(),
                    rental.getTotalValue()
            );
        }).toList();
    }

}

