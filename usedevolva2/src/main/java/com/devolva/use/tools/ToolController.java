package com.devolva.use.tools;

import com.devolva.use.tools.domain.ToolImageModel;
import com.devolva.use.tools.domain.ToolModel;
import com.devolva.use.tools.dtos.*;
import com.devolva.use.tools.usecases.ToolUsecases;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/tools")
public class ToolController {

    private final ToolUsecases toolUsecases;

    public ToolController(ToolUsecases toolUsecases) {
        this.toolUsecases = toolUsecases;
    }

    @PostMapping(value = "/owner/{ownerId}", consumes = {"multipart/form-data"})
    public ResponseEntity<?> createTool(
            @PathVariable Long ownerId,
            @RequestPart("tool") CreateToolDto dto,
            @RequestPart("files") MultipartFile[] files
    ) {
        try {
            ToolModel tool = toolUsecases.createToolWithImages(ownerId, dto, files);
            return ResponseEntity.status(HttpStatus.CREATED).body(tool);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erro ao cadastrar ferramenta com imagem: " + e.getMessage());
        }
    }

    @PatchMapping("/{toolId}/owner/{ownerId}")
    public ResponseEntity<ToolModel> updateTool(
            @PathVariable Long toolId,
            @PathVariable Long ownerId,
            @RequestBody UpdateToolDto dto
    ) {
        return ResponseEntity.ok(toolUsecases.updateTool(toolId, ownerId, dto));
    }

    @DeleteMapping("/{toolId}/owner/{ownerId}")
    public ResponseEntity<Void> deleteTool(@PathVariable Long toolId, @PathVariable Long ownerId) {
        toolUsecases.deleteTool(toolId, ownerId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<List<ToolModel>> listOwnerTools(@PathVariable Long ownerId) {
        return ResponseEntity.ok(toolUsecases.listOwnerTools(ownerId));
    }

    @GetMapping("/search")
    public ResponseEntity<List<ToolResponseDto>> searchTools(
            @RequestParam(required = false) String busca,
            @RequestParam(required = false) String categoria,
            @RequestParam(required = false) String estadoConservacao,
            @RequestParam(required = false) BigDecimal valorMinimo,
            @RequestParam(required = false) BigDecimal valorMaximo,
            @RequestParam(required = false) Boolean disponivel
    ) {
        ToolFilterDto filter = new ToolFilterDto(
                busca,
                categoria,
                estadoConservacao,
                valorMinimo,
                valorMaximo,
                disponivel
        );

        return ResponseEntity.ok(toolUsecases.searchTools(filter));
    }


    @GetMapping("/{toolId}")
    public ResponseEntity<ToolResponseDto> findById(@PathVariable Long toolId) {
        return ResponseEntity.ok(toolUsecases.findToolDetailsById(toolId));
    }

    @PostMapping("/{toolId}/owner/{ownerId}/images")
    public ResponseEntity<?> uploadImages(
            @PathVariable Long toolId,
            @PathVariable Long ownerId,
            @RequestParam("files") MultipartFile[] files
    ) {
        try {
            toolUsecases.uploadImages(toolId, ownerId, files);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erro ao enviar imagens: " + e.getMessage());
        }
    }

    @GetMapping("/{toolId}/images")
    public ResponseEntity<List<ToolImageModel>> listImages(@PathVariable Long toolId) {
        return ResponseEntity.ok(toolUsecases.listImages(toolId));
    }
    @DeleteMapping("/images/{imageId}/owner/{ownerId}")
    public ResponseEntity<Void> deleteImage(
            @PathVariable Long imageId,
            @PathVariable Long ownerId
    ) {
        toolUsecases.deleteImage(imageId, ownerId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/images/{imageId}/owner/{ownerId}/main")
    public ResponseEntity<Void> setMainImage(
            @PathVariable Long imageId,
            @PathVariable Long ownerId
    ) {
        toolUsecases.setMainImage(imageId, ownerId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<ToolResponseDto>> listAvailableTools() {
        return ResponseEntity.ok(toolUsecases.listAvailableTools());
    }

    @PatchMapping("/{toolId}/owner/{ownerId}/block")
    public ResponseEntity<?> blockTool( 
                                        @PathVariable Long toolId,
                                        @PathVariable Long ownerId,
                                        @RequestBody BlockToolDto dto
    ) {
        try {
            ToolModel tool = toolUsecases.blockTool(toolId, ownerId, dto);
            return ResponseEntity.ok(tool);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }



}