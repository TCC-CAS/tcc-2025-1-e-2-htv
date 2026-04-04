package com.devolva.use.rentals.usecases;

import com.devolva.use.payments.domain.PaymentModel;
import com.devolva.use.payments.domain.PaymentStatus;
import com.devolva.use.payments.repository.PaymentRepository;
import com.devolva.use.rentals.domain.RentalModel;
import com.devolva.use.rentals.domain.RentalStatus;
import com.devolva.use.rentals.dtos.ApproveRentalDto;
import com.devolva.use.rentals.dtos.CreateRentalDto;
import com.devolva.use.rentals.dtos.ReturnRentalDto;
import com.devolva.use.rentals.dtos.StartRentalDto;
import com.devolva.use.rentals.repository.RentalRepository;
import com.devolva.use.tools.domain.ToolModel;
import com.devolva.use.tools.repository.ToolRepository;
import com.devolva.use.users.domain.UserModel;
import com.devolva.use.users.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class RentalUsecases {

    private static final double SERVICE_FEE_PERCENT = 0.07;
    private static final double LATE_FEE_PERCENT_PER_DAY = 0.20;

    private final RentalRepository rentalRepository;
    private final ToolRepository toolRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;

    public RentalUsecases(
            RentalRepository rentalRepository,
            ToolRepository toolRepository,
            UserRepository userRepository,
            PaymentRepository paymentRepository
    ) {
        this.rentalRepository = rentalRepository;
        this.toolRepository = toolRepository;
        this.userRepository = userRepository;
        this.paymentRepository = paymentRepository;
    }

    public RentalModel createRentalRequest(CreateRentalDto dto) {
        if (dto.startDate() == null || dto.endDate() == null) {
            throw new RuntimeException("As datas de início e fim são obrigatórias.");
        }

        if (dto.endDate().isBefore(dto.startDate())) {
            throw new RuntimeException("A data final não pode ser menor que a data inicial.");
        }

        ToolModel tool = toolRepository.findById(dto.toolId())
                .orElseThrow(() -> new RuntimeException("Ferramenta não encontrada."));

        UserModel tenant = userRepository.findById(dto.tenantId())
                .orElseThrow(() -> new RuntimeException("Usuário locatário não encontrado."));

        if (tool.getProprietarioId() == null) {
            throw new RuntimeException("A ferramenta não possui proprietário vinculado.");
        }

        if (tool.getProprietarioId().equals(tenant.getId())) {
            throw new RuntimeException("O usuário não pode alugar a própria ferramenta.");
        }

        if (!tool.isDisponivel()) {
            throw new RuntimeException("A ferramenta não está disponível.");
        }

        long activeRequests = rentalRepository.findAll().stream()
                .filter(r -> r.getTenantId().equals(tenant.getId()))
                .filter(r -> r.getStatus() == RentalStatus.PENDING
                        || r.getStatus() == RentalStatus.AWAITING_PAYMENT
                        || r.getStatus() == RentalStatus.PAID
                        || r.getStatus() == RentalStatus.IN_USE)
                .count();

        if (activeRequests >= 10) {
            throw new RuntimeException("O usuário já atingiu o limite de 10 solicitações simultâneas.");
        }

        boolean hasConflict = rentalRepository.findAll().stream()
                .filter(r -> r.getToolId().equals(dto.toolId()))
                .filter(r -> r.getStatus() == RentalStatus.PENDING
                        || r.getStatus() == RentalStatus.AWAITING_PAYMENT
                        || r.getStatus() == RentalStatus.PAID
                        || r.getStatus() == RentalStatus.IN_USE)
                .anyMatch(r ->
                        !(dto.endDate().isBefore(r.getStartDate()) || dto.startDate().isAfter(r.getEndDate()))
                );

        if (hasConflict) {
            throw new RuntimeException("A ferramenta não está disponível para o período informado.");
        }

        long totalDays = ChronoUnit.DAYS.between(dto.startDate(), dto.endDate()) + 1;

        double dailyRate = tool.getValorDiaria();
        double baseValue = dailyRate * totalDays;
        double serviceFee = baseValue * SERVICE_FEE_PERCENT;
        double totalValue = baseValue + serviceFee;

        RentalModel rental = new RentalModel();
        rental.setToolId(tool.getId());
        rental.setOwnerId(tool.getProprietarioId());
        rental.setTenantId(tenant.getId());
        rental.setStartDate(dto.startDate());
        rental.setEndDate(dto.endDate());
        rental.setTotalDays((int) totalDays);
        rental.setDailyRate(dailyRate);
        rental.setBaseValue(baseValue);
        rental.setServiceFee(serviceFee);
        rental.setTotalValue(totalValue);
        rental.setOwnerNetValue(baseValue);
        rental.setStatus(RentalStatus.PENDING);

        return rentalRepository.save(rental);
    }

    public RentalModel approveOrRejectRental(Long rentalId, ApproveRentalDto dto) {
        RentalModel rental = rentalRepository.findById(rentalId)
                .orElseThrow(() -> new RuntimeException("Locação não encontrada."));

        if (!rental.getOwnerId().equals(dto.ownerId())) {
            throw new RuntimeException("Somente o proprietário pode aprovar ou recusar a solicitação.");
        }

        if (rental.getStatus() != RentalStatus.PENDING) {
            throw new RuntimeException("A solicitação já foi processada.");
        }

        rental.setRespondedAt(LocalDateTime.now());

        if (Boolean.TRUE.equals(dto.approved())) {
            rental.setStatus(RentalStatus.AWAITING_PAYMENT);

            PaymentModel payment = new PaymentModel();
            payment.setRentalId(rental.getId());
            payment.setGrossAmount(rental.getBaseValue());
            payment.setServiceFee(rental.getServiceFee());
            payment.setNetAmount(rental.getOwnerNetValue());
            payment.setStatus(PaymentStatus.PENDING);

            PaymentModel savedPayment = paymentRepository.save(payment);
            rental.setPaymentId(savedPayment.getId());
        } else {
            rental.setStatus(RentalStatus.REJECTED);
        }

        return rentalRepository.save(rental);
    }

    public RentalModel markAsPaid(Long rentalId) {
        RentalModel rental = rentalRepository.findById(rentalId)
                .orElseThrow(() -> new RuntimeException("Locação não encontrada."));

        if (rental.getPaymentId() == null) {
            throw new RuntimeException("Não existe pagamento vinculado para esta locação.");
        }

        PaymentModel payment = paymentRepository.findById(rental.getPaymentId())
                .orElseThrow(() -> new RuntimeException("Pagamento não encontrado."));

        if (payment.getStatus() != PaymentStatus.CONFIRMED) {
            throw new RuntimeException("O pagamento ainda não foi confirmado.");
        }

        rental.setPaidAt(LocalDateTime.now());
        rental.setStatus(RentalStatus.PAID);

        return rentalRepository.save(rental);
    }

    public RentalModel startRental(Long rentalId, StartRentalDto dto) {
        RentalModel rental = rentalRepository.findById(rentalId)
                .orElseThrow(() -> new RuntimeException("Locação não encontrada."));

        if (!rental.getOwnerId().equals(dto.ownerId())) {
            throw new RuntimeException("Somente o proprietário pode iniciar a locação.");
        }

        if (rental.getStatus() != RentalStatus.PAID) {
            throw new RuntimeException("A locação só pode ser iniciada após pagamento confirmado.");
        }

        rental.setStartedAt(LocalDateTime.now());
        rental.setStatus(RentalStatus.IN_USE);

        return rentalRepository.save(rental);
    }

    public RentalModel returnRental(Long rentalId, ReturnRentalDto dto) {
        RentalModel rental = rentalRepository.findById(rentalId)
                .orElseThrow(() -> new RuntimeException("Locação não encontrada."));

        if (!rental.getOwnerId().equals(dto.ownerId())) {
            throw new RuntimeException("Somente o proprietário pode finalizar a devolução.");
        }

        if (rental.getStatus() != RentalStatus.IN_USE && rental.getStatus() != RentalStatus.PAID) {
            throw new RuntimeException("A locação não está em um estado válido para devolução.");
        }

        rental.setActualReturnDate(dto.actualReturnDate());
        rental.setReturnedAt(LocalDateTime.now());

        if (dto.actualReturnDate() != null && dto.actualReturnDate().isAfter(rental.getEndDate())) {
            long lateDays = ChronoUnit.DAYS.between(rental.getEndDate(), dto.actualReturnDate());
            double dailyLateFee = rental.getDailyRate() * LATE_FEE_PERCENT_PER_DAY;
            double lateFee = dailyLateFee * lateDays;

            rental.setLateFee(lateFee);
            rental.setStatus(RentalStatus.LATE_RETURNED);
        } else {
            rental.setStatus(RentalStatus.RETURNED);
        }

        return rentalRepository.save(rental);
    }

    public List<RentalModel> findAll() {
        return rentalRepository.findAll();
    }

    public RentalModel findById(Long rentalId) {
        return rentalRepository.findById(rentalId)
                .orElseThrow(() -> new RuntimeException("Locação não encontrada."));
    }

    public List<RentalModel> findByTenantId(Long tenantId) {
        return rentalRepository.findAll().stream()
                .filter(r -> r.getTenantId().equals(tenantId))
                .toList();
    }

    public List<RentalModel> findByOwnerId(Long ownerId) {
        return rentalRepository.findAll().stream()
                .filter(r -> r.getOwnerId().equals(ownerId))
                .toList();
    }
}