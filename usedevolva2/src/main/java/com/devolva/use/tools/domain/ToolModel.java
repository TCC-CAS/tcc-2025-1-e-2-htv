package com.devolva.use.tools.domain;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class ToolModel {

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
    }

}