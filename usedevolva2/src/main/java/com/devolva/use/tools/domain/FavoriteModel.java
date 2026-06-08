package com.devolva.use.tools.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "user_favorites", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"userId", "toolId"})
})
public class FavoriteModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    private Long toolId;

    private LocalDateTime createdAt;

    public FavoriteModel() {
        this.createdAt = LocalDateTime.now();
    }

    public FavoriteModel(Long userId, Long toolId) {
        this.userId = userId;
        this.toolId = toolId;
        this.createdAt = LocalDateTime.now();
    }
}