package com.devolva.use.tools.usecases;

import com.devolva.use.tools.dtos.*;
import com.devolva.use.rentals.domain.RentalModel;
import com.devolva.use.rentals.domain.RentalStatus;
import com.devolva.use.rentals.repository.RentalRepository;
import com.devolva.use.tools.domain.ToolModel;
import com.devolva.use.tools.repository.ToolImageRepository;
import com.devolva.use.tools.repository.ToolRepository;
import com.devolva.use.users.domain.UserModel;
import com.devolva.use.users.domain.UserStatus;
import com.devolva.use.users.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import com.devolva.use.tools.domain.ToolImageModel;
import org.springframework.web.multipart.MultipartFile;
import com.cloudinary.Cloudinary;
import com.devolva.use.uploads.ImageUploadConfirmationService;

import com.devolva.use.addresses.domain.AddressModel;
import com.devolva.use.addresses.usecases.AddressUsecases;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
// import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static com.devolva.use.users.domain.UserModel.Plano.*;

@Service
public class ToolUsecases {

    private final ToolRepository toolRepository;
    private final UserRepository userRepository;
    private final RentalRepository rentalRepository;
    private final ToolImageRepository toolImageRepository;
    private final Cloudinary cloudinary;
    private final ImageUploadConfirmationService imageUploadConfirmationService;
    private final AddressUsecases addressUsecases;

    public ToolUsecases(
            ToolRepository toolRepository,
            UserRepository userRepository,
            RentalRepository rentalRepository,
            ToolImageRepository toolImageRepository,
            Cloudinary cloudinary,
            ImageUploadConfirmationService imageUploadConfirmationService,
            AddressUsecases addressUsecases
    ) {
        this.toolRepository = toolRepository;
        this.userRepository = userRepository;
        this.rentalRepository = rentalRepository;
        this.toolImageRepository = toolImageRepository;
        this.cloudinary = cloudinary;
        this.imageUploadConfirmationService = imageUploadConfirmationService;
        this.addressUsecases = addressUsecases;
    }

    public ToolModel createTool(Long ownerId, CreateToolDto dto) {
        UserModel owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new IllegalArgumentException("Usuário proprietário não encontrado."));

        if (owner.getStatus() != UserStatus.ATIVO) {
            throw new IllegalStateException("Usuário proprietário não está ativo.");
        }

        long activeTools = toolRepository.countActiveToolsByOwnerId(ownerId);
        int limit = getToolLimitByPlan(owner.getPlano());

        if (activeTools >= limit) {
            throw new IllegalStateException("Limite de ferramentas do plano atingido.");
        }

        AddressModel address = null;

        if (dto.addressId() != null) {
            address = addressUsecases.findOwnedAddress(dto.addressId(), ownerId);
        }

        validateTool(
                dto.nome(),
                dto.descricao(),
                dto.categoria(),
                dto.estadoConservacao(),
                dto.valorDiaria(),
                dto.quantidadeFotos(),
                dto.addressId(),
                dto.localizacao(),
                dto.dataInicioDisponibilidade()
        );

        ToolModel tool = new ToolModel();
        tool.setNome(dto.nome());
        tool.setDescricao(dto.descricao());
        tool.setCategoria(dto.categoria());
        tool.setEstadoConservacao(dto.estadoConservacao());
        tool.setValorDiaria(dto.valorDiaria());
        tool.setOwnerId(ownerId);
        tool.setAtivo(true);
        tool.setDisponivel(true);
        tool.setBloqueadaTemporariamente(false);
        tool.setQuantidadeFotos(dto.quantidadeFotos());
        tool.setCreatedAt(LocalDateTime.now());
        tool.setUpdatedAt(LocalDateTime.now());
        tool.setLocalizacao(dto.localizacao());
        tool.setDataInicioDisponibilidade(dto.dataInicioDisponibilidade());
        tool.setDataFimDisponibilidade(dto.dataFimDisponibilidade());
        tool.setObservacoes(dto.observacoes());

        if (address != null) {
            tool.setAddressId(address.getId());
            tool.setCep(address.getCep());
            tool.setLogradouro(address.getLogradouro());
            tool.setNumero(address.getNumero());
            tool.setComplemento(address.getComplemento());
            tool.setBairro(address.getBairro());
            tool.setCidade(address.getCidade());
            tool.setEstado(address.getEstado());
            tool.setLocalizacao(address.getEnderecoCompleto());
        } else {
            tool.setLocalizacao(dto.localizacao());
            tool.setCep(dto.cep());
            tool.setLogradouro(dto.logradouro());
            tool.setNumero(dto.numero());
            tool.setComplemento(dto.complemento());
            tool.setBairro(dto.bairro());
            tool.setCidade(dto.cidade());
            tool.setEstado(dto.estado());
        }

        return toolRepository.save(tool);
    }
    private int getToolLimitByPlan(UserModel.Plano plano) {
        if (plano == null) {
            return 3;
        }
        switch (plano) {
            case FREE:
                return 3;
            case PRATA:
                return 30;
            case OURO:
                return 100;
            default:
                return 0;
        }
    }
    public ToolModel updateTool(Long toolId, Long ownerId, UpdateToolDto dto) {
        ToolModel tool = findOwnedTool(toolId, ownerId);

        validateTool(
                dto.nome(),
                dto.descricao(),
                dto.categoria(),
                dto.estadoConservacao(),
                dto.valorDiaria(),
                dto.quantidadeFotos(),
                dto.addressId(),
                dto.localizacao(),
                dto.dataInicioDisponibilidade()
        );

        AddressModel address = null;

        if (dto.addressId() != null) {
            address = addressUsecases.findOwnedAddress(dto.addressId(), ownerId);
        }

        if (dto.nome() != null) tool.setNome(dto.nome());
        if (dto.descricao() != null) tool.setDescricao(dto.descricao());
        if (dto.categoria() != null) tool.setCategoria(dto.categoria());
        if (dto.estadoConservacao() != null) tool.setEstadoConservacao(dto.estadoConservacao());
        if (dto.valorDiaria() != null) tool.setValorDiaria(dto.valorDiaria());
        if (dto.quantidadeFotos() > 0) tool.setQuantidadeFotos(dto.quantidadeFotos());
        if (dto.disponivel() != null) tool.setDisponivel(dto.disponivel());
        if (address != null) {
            tool.setAddressId(address.getId());
            tool.setCep(address.getCep());
            tool.setLogradouro(address.getLogradouro());
            tool.setNumero(address.getNumero());
            tool.setComplemento(address.getComplemento());
            tool.setBairro(address.getBairro());
            tool.setCidade(address.getCidade());
            tool.setEstado(address.getEstado());
            tool.setLocalizacao(address.getEnderecoCompleto());
        } else if (dto.localizacao() != null) {
            tool.setLocalizacao(dto.localizacao());
        }
        if (dto.dataInicioDisponibilidade() != null) tool.setDataInicioDisponibilidade(dto.dataInicioDisponibilidade());
        if (dto.dataFimDisponibilidade() != null) tool.setDataFimDisponibilidade(dto.dataFimDisponibilidade());
        if (dto.observacoes() != null) tool.setObservacoes(dto.observacoes());

        tool.setUpdatedAt(LocalDateTime.now());

        return toolRepository.save(tool);
    }

    public List<ToolModel> listOwnerTools(Long ownerId) {
        return toolRepository.findByOwnerIdAndAtivoTrue(ownerId);
    }

    public void deleteTool(Long toolId, Long ownerId) {
        ToolModel tool = findOwnedTool(toolId, ownerId);

        if (hasPendingRentals(toolId)) {
            throw new IllegalStateException("Não é possível excluir a ferramenta pois existem aluguéis pendentes ou em andamento.");
        }

        tool.setAtivo(false);
        tool.setDisponivel(false);
        tool.setUpdatedAt(LocalDateTime.now());

        List<ToolImageModel> images = toolImageRepository.findByToolId(toolId);
        for (ToolImageModel img : images) {
            try {
                cloudinary.uploader().destroy(img.getFileName(), com.cloudinary.utils.ObjectUtils.emptyMap());
            } catch (IOException e) {
                System.err.println("Erro ao deletar imagem no Cloudinary: " + e.getMessage());
            }
        }

        toolRepository.save(tool);
    }

    public ToolModel findById(Long toolId) {
        return toolRepository.findById(toolId)
                .orElseThrow(() -> new IllegalArgumentException("Ferramenta não encontrada."));
    }

    private ToolModel findOwnedTool(Long toolId, Long ownerId) {
        ToolModel tool = findById(toolId);

        if (!tool.getOwnerId().equals(ownerId)) {
            throw new IllegalStateException("Ferramenta não pertence a este usuário.");
        }

        if (!tool.isAtivo()) {
            throw new IllegalStateException("Ferramenta inativa.");
        }

        return tool;
    }

    private void validateTool(
            String nome,
            String descricao,
            String categoria,
            String estadoConservacao,
            BigDecimal valorDiaria,
            int quantidadeFotos,
            Long addressId,
            String localizacao,
            LocalDate dataInicioDisponibilidade
    ) {
        if (nome == null || nome.isBlank()) {
            throw new IllegalArgumentException("Nome da ferramenta é obrigatório.");
        }

        if (descricao == null || descricao.isBlank()) {
            throw new IllegalArgumentException("Descrição da ferramenta é obrigatória.");
        }

        if (descricao.length() > 255) {
            throw new IllegalArgumentException("Descrição da ferramenta deve ter no máximo 255 caracteres.");
        }

        if (categoria == null || categoria.isBlank()) {
            throw new IllegalArgumentException("Categoria é obrigatória.");
        }

        if (estadoConservacao == null || estadoConservacao.isBlank()) {
            throw new IllegalArgumentException("Estado de conservação é obrigatório.");
        }

        if (valorDiaria == null || valorDiaria.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Valor da diária deve ser maior que zero.");
        }

        if (quantidadeFotos < 1 || quantidadeFotos > 5) {
            throw new IllegalArgumentException("A ferramenta deve ter entre 1 e 5 fotos.");
        }

        if (addressId == null && (localizacao == null || localizacao.isBlank())) {
            throw new IllegalArgumentException("Localização é obrigatória.");
        }

        if (dataInicioDisponibilidade == null) {
            throw new IllegalArgumentException("Data inicial de disponibilidade é obrigatória.");
        }
    }

    @Transactional
    public void uploadImages(Long toolId, Long ownerId, MultipartFile[] files) {
        ToolModel tool = findOwnedTool(toolId, ownerId);

        if (files == null || files.length < 1) {
            throw new IllegalArgumentException("A ferramenta deve ter pelo menos uma foto.");
        }

        if (files.length > 5) {
            throw new IllegalArgumentException("Limite excedido: podes enviar no máximo 5 fotos.");
        }

        List<String> uploadedPublicIds = new ArrayList<>();

        try {
            boolean hasImages = toolImageRepository.existsByToolId(toolId);

            for (MultipartFile file : files) {
                if (file.isEmpty()) continue;

                String contentType = file.getContentType();
                if (contentType == null || !contentType.startsWith("image/")) {
                    throw new IllegalArgumentException("O arquivo " + file.getOriginalFilename() + " não é uma imagem válida.");
                }

                Map uploadResult = uploadToolImageWithModeration(toolId, file);
                String publicId = String.valueOf(uploadResult.get("public_id"));
                uploadedPublicIds.add(publicId);
                imageUploadConfirmationService.validateModeration(uploadResult, file.getOriginalFilename());
                imageUploadConfirmationService.confirmAccessibleImage(cloudinary, uploadResult, file.getOriginalFilename());

                String urlDaFoto = String.valueOf(uploadResult.get("secure_url"));

                ToolImageModel image = new ToolImageModel();
                image.setToolId(toolId);
                image.setFilePath(urlDaFoto);
                image.setFileName(publicId);
                image.setContentType(contentType);

                image.setPrincipal(!hasImages);
                hasImages = true;

                toolImageRepository.save(image);
            }

            int totalImages = toolImageRepository.findByToolId(toolId).size();
            tool.setQuantidadeFotos(totalImages);
            tool.setUpdatedAt(LocalDateTime.now());
            toolRepository.save(tool);

        } catch (IOException e) {
            cleanupUploadedImages(uploadedPublicIds);
            throw new RuntimeException("Erro ao processar o upload das imagens.", e);
        } catch (RuntimeException e) {
            cleanupUploadedImages(uploadedPublicIds);
            throw e;
        }
    }

    private Map uploadToolImageWithModeration(Long toolId, MultipartFile file) throws IOException {
        try {
            return cloudinary.uploader().upload(file.getBytes(),
                    com.cloudinary.utils.ObjectUtils.asMap(
                            "folder", "tools/tool_" + toolId,
                            "resource_type", "image",
                            "moderation", "aws_rek"
                    ));
        } catch (Exception e1) {
            try {
                return cloudinary.uploader().upload(file.getBytes(),
                        com.cloudinary.utils.ObjectUtils.asMap(
                                "folder", "tools/tool_" + toolId,
                                "resource_type", "image",
                                "moderation", "webpurify"
                        ));
            } catch (Exception e2) {
                return cloudinary.uploader().upload(file.getBytes(),
                        com.cloudinary.utils.ObjectUtils.asMap(
                                "folder", "tools/tool_" + toolId,
                                "resource_type", "image"
                        ));
            }
        }
    }

    private void cleanupUploadedImages(List<String> uploadedPublicIds) {
        for (String publicId : uploadedPublicIds) {
            imageUploadConfirmationService.destroyUploadedImage(cloudinary, publicId);
        }
    }

    public List<ToolImageModel> listImages(Long toolId) {
        return toolImageRepository.findByToolId(toolId);
    }

    public void deleteImage(Long imageId, Long ownerId) {
        ToolImageModel image = toolImageRepository.findById(imageId)
                .orElseThrow(() -> new IllegalArgumentException("Imagem não encontrada."));

        ToolModel tool = findOwnedTool(image.getToolId(), ownerId);

        try {
            cloudinary.uploader().destroy(image.getFileName(), com.cloudinary.utils.ObjectUtils.emptyMap());
        } catch (IOException e) {
            throw new RuntimeException("Erro ao remover imagem do Cloudinary.", e);
        }

        toolImageRepository.delete(image);

        int totalImages = toolImageRepository.findByToolId(tool.getId()).size();
        tool.setQuantidadeFotos(totalImages);
        tool.setUpdatedAt(LocalDateTime.now());
        toolRepository.save(tool);
    }

    @Transactional
    public void setMainImage(Long imageId, Long ownerId) {
        ToolImageModel selectedImage = toolImageRepository.findById(imageId)
                .orElseThrow(() -> new IllegalArgumentException("Imagem não encontrada."));

        ToolModel tool = findOwnedTool(selectedImage.getToolId(), ownerId);

        toolImageRepository.clearPrincipalByToolId(tool.getId());

        selectedImage.setPrincipal(true);
        toolImageRepository.save(selectedImage);

        tool.setUpdatedAt(LocalDateTime.now());
        toolRepository.save(tool);
    }

    @Transactional(readOnly = true)
    public List<ToolResponseDto> listAvailableTools() {
        List<ToolModel> tools = toolRepository.findByAtivoTrueAndDisponivelTrue();
        List<ToolResponseDto> filteredTools = new java.util.ArrayList<>();

        java.util.Map<Long, UserModel> ownerCache = new java.util.HashMap<>();

        for (ToolModel tool : tools) {
            Long ownerId = tool.getOwnerId();

            UserModel owner = ownerCache.computeIfAbsent(ownerId, id ->
                    userRepository.findById(id).orElse(null)
            );

            if (owner != null) {
                long activeTools = toolRepository.countActiveToolsByOwnerId(ownerId);
                int limit = getToolLimitByPlan(owner.getPlano());

                if (activeTools <= limit) {
                    filteredTools.add(mapToResponseDto(tool, owner));
                }
            }
        }
        return filteredTools;
    }

    public boolean hasPendingRentals(Long toolId) {
        List<RentalModel> rentals = rentalRepository.findByToolId(toolId);

        for (RentalModel rental : rentals) {
            if (rental.getStatus() == RentalStatus.IN_USE || rental.getStatus() == RentalStatus.PENDING) {
                return true;
            }
        }

        return false;
    }
    public ToolModel findToolOrThrow(Long toolId) {
        return toolRepository.findById(toolId)
                .orElseThrow(() -> new IllegalArgumentException("Ferramenta não encontrada"));
    }

    @Transactional(readOnly = true)
    public ToolResponseDto findToolDetailsById(Long toolId) {
        ToolModel tool = findById(toolId);
        UserModel owner = userRepository.findById(tool.getOwnerId()).orElse(null);
        return mapToResponseDto(tool, owner);
    }


    public ToolModel blockTool(Long toolId, Long ownerId, BlockToolDto dto) {
        ToolModel tool = findOwnedTool(toolId, ownerId);

        if (hasPendingRentals(toolId)) {
            throw new IllegalStateException("Não é possível bloquear a ferramenta. Existem pendências de aluguel ou reservas em andamento.");
        }

        if (!dto.bloqueadaTemporariamente()) {
            UserModel owner = userRepository.findById(ownerId)
                    .orElseThrow(() -> new IllegalArgumentException("Usuário proprietário não encontrado."));

            long activeTools = toolRepository.countActiveToolsByOwnerId(ownerId);
            int limit = getToolLimitByPlan(owner.getPlano());

            if (activeTools > limit) {
                throw new IllegalStateException("Não é possível reativar. Você está acima do limite de " + limit + " ferramentas do plano " + owner.getPlano() + ". Exclua outras primeiro.");
            }
        }

        tool.setBloqueadaTemporariamente(dto.bloqueadaTemporariamente());
        if (dto.bloqueadaTemporariamente()) {
            tool.setDisponivel(false);
        } else {
            tool.setDisponivel(true);
        }

        tool.setUpdatedAt(LocalDateTime.now());
        return toolRepository.save(tool);
    }

    @Transactional
    public ToolModel createToolWithImages(Long ownerId, CreateToolDto dto, MultipartFile[] files) {
        ToolModel tool = createTool(ownerId, dto);
        uploadImages(tool.getId(), ownerId, files);
        return tool;
    }

    @Transactional(readOnly = true)
    public List<ToolResponseDto> searchTools(ToolFilterDto filter) {
        String busca = normalize(filter.busca());
        String categoria = normalize(filter.categoria());
        String estadoConservacao = normalize(filter.estadoConservacao());

        List<ToolModel> tools = toolRepository.searchTools(
                busca,
                categoria,
                estadoConservacao,
                filter.valorMinimo(),
                filter.valorMaximo(),
                filter.disponivel()
        );

        List<ToolResponseDto> filteredTools = new java.util.ArrayList<>();
        java.util.Map<Long, UserModel> ownerCache = new java.util.HashMap<>();

        for (ToolModel tool : tools) {
            Long ownerId = tool.getOwnerId();

            UserModel owner = ownerCache.computeIfAbsent(ownerId, id ->
                    userRepository.findById(id).orElse(null)
            );

            if (owner != null) {
                long activeTools = toolRepository.countActiveToolsByOwnerId(ownerId);
                int limit = getToolLimitByPlan(owner.getPlano());

                if (activeTools <= limit) {
                    filteredTools.add(mapToResponseDto(tool, owner));
                }
            }
        }
        return filteredTools;
    }

    private String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }

    private boolean isOwnerWithinPlanLimit(Long ownerId) {
        return userRepository.findById(ownerId).map(owner -> {
            long activeTools = toolRepository.countActiveToolsByOwnerId(ownerId);
            int limit = getToolLimitByPlan(owner.getPlano());
            return activeTools <= limit; // Retorna true se estiver dentro ou igual ao limite
        }).orElse(false);
    }

    private ToolResponseDto mapToResponseDto(ToolModel tool, UserModel owner) {
        String ownerNome = (owner != null) ? owner.getNomeCompleto() : "Desconhecido";
        String ownerPlano = (owner != null && owner.getPlano() != null) ? owner.getPlano().name() : "FREE";
        String ownerProfileImageUrl = (owner != null) ? owner.getProfileImageUrl() : null;

        return new ToolResponseDto(
                tool.getId(),
                tool.getNome(),
                tool.getDescricao(),
                tool.getCategoria(),
                tool.getEstadoConservacao(),
                tool.getValorDiaria(),
                tool.getOwnerId(),
                ownerNome,
                ownerPlano,
                ownerProfileImageUrl,
                tool.isDisponivel(),
                tool.getCep(),
                tool.getLogradouro(),
                tool.getNumero(),
                tool.getComplemento(),
                tool.getBairro(),
                tool.getCidade(),
                tool.getEstado(),
                tool.getLocalizacao(),
                tool.getObservacoes(),
                tool.getDataInicioDisponibilidade(),
                tool.getDataFimDisponibilidade()
        );
    }

    @Transactional
    public ToolModel adminDisableTool(
            Long toolId,
            Long adminId,
            String reason
    ) {

        ToolModel tool = findToolOrThrow(toolId);

        tool.setAtivo(true);

        tool.setDisponivel(false);
        tool.setBloqueadaTemporariamente(true);

        tool.setModerada(true);
        tool.setMotivoModeracao(reason);

        tool.setModeradaEm(LocalDateTime.now());
        tool.setModeradaPorAdminId(adminId);

        tool.setUpdatedAt(LocalDateTime.now());

        return toolRepository.save(tool);
    }

}