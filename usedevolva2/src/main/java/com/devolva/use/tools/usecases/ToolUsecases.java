package com.devolva.use.tools.usecases;

import com.devolva.use.tools.domain.ToolModel;
import com.devolva.use.tools.dtos.BlockToolDto;
import com.devolva.use.tools.dtos.CreateToolDto;
import com.devolva.use.tools.dtos.UpdateToolDto;
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
import java.util.List;
import com.devolva.use.tools.domain.ToolImageModel;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

import static com.devolva.use.users.domain.UserModel.Plano.*;

@Service
public class ToolUsecases {

    private final ToolRepository toolRepository;
    private final UserRepository userRepository;

    private final ToolImageRepository toolImageRepository;

    public ToolUsecases(
            ToolRepository toolRepository,
            UserRepository userRepository,
            ToolImageRepository toolImageRepository
    ) {
        this.toolRepository = toolRepository;
        this.userRepository = userRepository;
        this.toolImageRepository = toolImageRepository;
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

        validateTool(
                dto.nome(),
                dto.descricao(),
                dto.categoria(),
                dto.estadoConservacao(),
                dto.valorDiaria(),
                dto.quantidadeFotos(),
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

        return toolRepository.save(tool);
    }
    private int getToolLimitByPlan(UserModel.Plano plano) {
        switch (plano) {
            case FREE:
                return 3;
            case BRONZE:
                return 10;
            case PRATA:
                return 30;
            case OURO:
                return 50;
            case DIAMANTE:
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
                dto.localizacao(),
                dto.dataInicioDisponibilidade()
        );

        if (dto.nome() != null) tool.setNome(dto.nome());
        if (dto.descricao() != null) tool.setDescricao(dto.descricao());
        if (dto.categoria() != null) tool.setCategoria(dto.categoria());
        if (dto.estadoConservacao() != null) tool.setEstadoConservacao(dto.estadoConservacao());
        if (dto.valorDiaria() != null) tool.setValorDiaria(dto.valorDiaria());
        if (dto.quantidadeFotos() > 0) tool.setQuantidadeFotos(dto.quantidadeFotos());
        if (dto.disponivel() != null) tool.setDisponivel(dto.disponivel());
        if (dto.localizacao() != null) tool.setLocalizacao(dto.localizacao());
        if (dto.dataInicioDisponibilidade() != null) tool.setDataInicioDisponibilidade(dto.dataInicioDisponibilidade());
        if (dto.dataFimDisponibilidade() != null) tool.setDataFimDisponibilidade(dto.dataFimDisponibilidade());
        if (dto.observacoes() != null) tool.setObservacoes(dto.observacoes());

        tool.setUpdatedAt(LocalDateTime.now());

        return toolRepository.save(tool);
    }

    public void deleteTool(Long toolId, Long ownerId) {
        ToolModel tool = findOwnedTool(toolId, ownerId);

        // depois integrar com rentals para bloquear exclusão com reserva ativa
        tool.setAtivo(false);
        tool.setDisponivel(false);
        tool.setUpdatedAt(LocalDateTime.now());

        toolRepository.save(tool);
    }

    public ToolModel blockTool(Long toolId, Long ownerId, BlockToolDto dto) {
        ToolModel tool = findOwnedTool(toolId, ownerId);

        tool.setBloqueadaTemporariamente(dto.bloqueadaTemporariamente());
        if (dto.bloqueadaTemporariamente()) {
            tool.setDisponivel(false);
        }

        tool.setUpdatedAt(LocalDateTime.now());

        return toolRepository.save(tool);
    }

    public List<ToolModel> listOwnerTools(Long ownerId) {
        return toolRepository.findByOwnerId(ownerId);
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
            String localizacao,
            LocalDate dataInicioDisponibilidade
    ) {
        if (nome == null || nome.isBlank()) {
            throw new IllegalArgumentException("Nome da ferramenta é obrigatório.");
        }

        if (descricao == null || descricao.isBlank()) {
            throw new IllegalArgumentException("Descrição da ferramenta é obrigatória.");
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

        if (quantidadeFotos < 1 || quantidadeFotos > 10) {
            throw new IllegalArgumentException("A ferramenta deve ter entre 1 e 10 fotos.");
        }

        if (localizacao == null || localizacao.isBlank()) {
            throw new IllegalArgumentException("Localização é obrigatória.");
        }

        if (dataInicioDisponibilidade == null) {
            throw new IllegalArgumentException("Data inicial de disponibilidade é obrigatória.");
        }
    }

    public void uploadImages(Long toolId, Long ownerId, MultipartFile[] files) {
        ToolModel tool = findOwnedTool(toolId, ownerId);

        if (files == null || files.length < 1) {
            throw new IllegalArgumentException("A ferramenta deve ter pelo menos uma foto.");
        }

        if (files.length > 10) {
            throw new IllegalArgumentException("A ferramenta pode ter no máximo 10 fotos.");
        }

        try {
            Path uploadPath = Paths.get("uploads", "tools", String.valueOf(toolId))
                    .toAbsolutePath()
                    .normalize();

            Files.createDirectories(uploadPath);

            boolean mainImageAlreadyDefined = toolImageRepository.existsByToolId(toolId);

            for (MultipartFile file : files) {
                if (file.isEmpty()) continue;

                String contentType = file.getContentType();

                if (contentType == null || !contentType.startsWith("image/")) {
                    throw new IllegalArgumentException("Apenas arquivos de imagem são permitidos.");
                }

                String originalName = file.getOriginalFilename();
                String extension = "";

                if (originalName != null && originalName.contains(".")) {
                    extension = originalName.substring(originalName.lastIndexOf("."));
                }

                String fileName = UUID.randomUUID() + extension;

                Path destination = uploadPath.resolve(fileName).normalize();

                Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);

                ToolImageModel image = new ToolImageModel();
                image.setToolId(toolId);
                image.setFileName(fileName);
                image.setFilePath("/uploads/tools/" + toolId + "/" + fileName);
                image.setContentType(contentType);

                if (!mainImageAlreadyDefined) {
                    image.setPrincipal(true);
                    mainImageAlreadyDefined = true;
                } else {
                    image.setPrincipal(false);
                }

                toolImageRepository.save(image);
            }

            int totalImages = toolImageRepository.findByToolId(tool.getId()).size();
            tool.setQuantidadeFotos(totalImages);
            tool.setUpdatedAt(LocalDateTime.now());
            toolRepository.save(tool);

        } catch (IOException e) {
            throw new RuntimeException("Erro ao salvar imagem da ferramenta.", e);
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
            Path imagePath = Paths.get(image.getFilePath().replaceFirst("^/", ""))
                    .toAbsolutePath()
                    .normalize();

            Files.deleteIfExists(imagePath);

        } catch (IOException e) {
            throw new RuntimeException("Erro ao remover arquivo da imagem.", e);
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

    public List<ToolModel> listAvailableTools() {
        return toolRepository.findByAtivoTrueAndDisponivelTrue();
    }
    
}