package com.devolva.use.tools.usecases;

import com.devolva.use.tools.domain.FavoriteModel;
import com.devolva.use.tools.domain.ToolModel;
import com.devolva.use.tools.repository.FavoriteRepository;
import com.devolva.use.tools.repository.ToolRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FavoriteUsecases {

    private final FavoriteRepository favoriteRepository;
    private final ToolRepository toolRepository;

    public FavoriteUsecases(FavoriteRepository favoriteRepository, ToolRepository toolRepository) {
        this.favoriteRepository = favoriteRepository;
        this.toolRepository = toolRepository;
    }

    @Transactional
    public void addFavorite(Long userId, Long toolId) {
        // Valida se a ferramenta existe e está ativa
        ToolModel tool = toolRepository.findById(toolId)
                .orElseThrow(() -> new IllegalArgumentException("Ferramenta não encontrada."));
        if (!tool.isAtivo()) {
            throw new IllegalStateException("Não é possível favoritar uma ferramenta inativa.");
        }

        // Evita duplicidade
        if (!favoriteRepository.existsByUserIdAndToolId(userId, toolId)) {
            favoriteRepository.save(new FavoriteModel(userId, toolId));
        }
    }

    @Transactional
    public void removeFavorite(Long userId, Long toolId) {
        favoriteRepository.deleteByUserIdAndToolId(userId, toolId);
    }

    public List<ToolModel> listUserFavorites(Long userId) {
        List<FavoriteModel> favorites = favoriteRepository.findByUserId(userId);

        // Mapeia e retorna os detalhes de todas as ferramentas que o usuário favoritou
        return favorites.stream()
                .map(fav -> toolRepository.findById(fav.getToolId()).orElse(null))
                .filter(tool -> tool != null && tool.isAtivo())
                .collect(Collectors.toList());
    }

    public boolean isFavorited(Long userId, Long toolId) {
        return favoriteRepository.existsByUserIdAndToolId(userId, toolId);
    }
}