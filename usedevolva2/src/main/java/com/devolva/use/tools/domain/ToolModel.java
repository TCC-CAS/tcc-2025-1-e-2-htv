package com.devolva.use.tools.domain;

import jakarta.persistence.*; // Importante para o Spring Boot 3+
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "tools")
public class ToolModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;
    private String descricao;
    private String categoria;
    private String estadoConservacao;
    private BigDecimal valorDiaria;
    private Long ownerId;

    private boolean ativo;
    private boolean disponivel;
    private boolean bloqueadaTemporariamente;
    private int quantidadeFotos;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ToolModel() {
        this.createdAt = LocalDateTime.now();
        this.ativo = true;
        this.disponivel = true;
    }

    @PreUpdate // Atualiza o updatedAt automaticamente antes de salvar
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
