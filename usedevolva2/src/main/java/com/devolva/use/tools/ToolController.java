package com.devolva.use.tools;

import com.devolva.use.tools.domain.ToolImageModel;
import com.devolva.use.tools.domain.ToolModel;
import com.devolva.use.tools.dtos.BlockToolDto;
import com.devolva.use.tools.dtos.CreateToolDto;
import com.devolva.use.tools.dtos.UpdateToolDto;
import com.devolva.use.tools.usecases.ToolUsecases;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/tools")
public class ToolController {

    private final ToolUsecases toolUsecases;

    public ToolController(ToolUsecases toolUsecases) {
        this.toolUsecases = toolUsecases;
    }

    @PostMapping("/owner/{ownerId}")
    public ResponseEntity<ToolModel> createTool(@PathVariable Long ownerId, @RequestBody CreateToolDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(toolUsecases.createTool(ownerId, dto));
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

    @PatchMapping("/{toolId}/owner/{ownerId}/block")
    public ResponseEntity<ToolModel> blockTool(
            @PathVariable Long toolId,
            @PathVariable Long ownerId,
            @RequestBody BlockToolDto dto
    ) {
        return ResponseEntity.ok(toolUsecases.blockTool(toolId, ownerId, dto));
    }

    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<List<ToolModel>> listOwnerTools(@PathVariable Long ownerId) {
        return ResponseEntity.ok(toolUsecases.listOwnerTools(ownerId));
    }

    @GetMapping("/{toolId}")
    public ResponseEntity<ToolModel> findById(@PathVariable Long toolId) {
        return ResponseEntity.ok(toolUsecases.findById(toolId));
    }

    @PostMapping("/{toolId}/owner/{ownerId}/images")
    public ResponseEntity<Void> uploadImages(
            @PathVariable Long toolId,
            @PathVariable Long ownerId,
            @RequestParam("files") MultipartFile[] files
    ) {
        toolUsecases.uploadImages(toolId, ownerId, files);
        return ResponseEntity.status(HttpStatus.CREATED).build();
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
    public ResponseEntity<List<ToolModel>> listAvailableTools() {
        return ResponseEntity.ok(toolUsecases.listAvailableTools());
    }
}