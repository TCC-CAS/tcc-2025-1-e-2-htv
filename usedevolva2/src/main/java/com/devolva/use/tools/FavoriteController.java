package com.devolva.use.tools;

import com.devolva.use.tools.domain.ToolModel;
import com.devolva.use.tools.usecases.FavoriteUsecases;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/favorites")
public class FavoriteController {

    private final FavoriteUsecases favoriteUsecases;

    public FavoriteController(FavoriteUsecases favoriteUsecases) {
        this.favoriteUsecases = favoriteUsecases;
    }

    @PostMapping
    public ResponseEntity<String> addFavorite(@RequestParam Long userId, @RequestParam Long toolId) {
        try {
            favoriteUsecases.addFavorite(userId, toolId);
            return ResponseEntity.ok("Ferramenta adicionada aos favoritos.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping
    public ResponseEntity<Void> removeFavorite(@RequestParam Long userId, @RequestParam Long toolId) {
        favoriteUsecases.removeFavorite(userId, toolId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ToolModel>> listUserFavorites(@PathVariable Long userId) {
        return ResponseEntity.ok(favoriteUsecases.listUserFavorites(userId));
    }

    @GetMapping("/check")
    public ResponseEntity<Boolean> isFavorited(@RequestParam Long userId, @RequestParam Long toolId) {
        return ResponseEntity.ok(favoriteUsecases.isFavorited(userId, toolId));
    }
}