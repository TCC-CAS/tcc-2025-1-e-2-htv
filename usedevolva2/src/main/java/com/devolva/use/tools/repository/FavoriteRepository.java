package com.devolva.use.tools.repository;

import com.devolva.use.tools.domain.FavoriteModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteRepository extends JpaRepository<FavoriteModel, Long> {
    List<FavoriteModel> findByUserId(Long userId);
    Optional<FavoriteModel> findByUserIdAndToolId(Long userId, Long toolId);
    boolean existsByUserIdAndToolId(Long userId, Long toolId);
    void deleteByUserIdAndToolId(Long userId, Long toolId);
}