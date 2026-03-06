package com.devolva.use.tools.domain;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ToolModel {

    private Long id;
    private String nome;
    private String descricao;
    private String categoria;
    private String estadoConservacao;
    private Double valorDiaria;
    private boolean disponivel;
    private Long ownerId;

    public ToolModel() {
    }

    public ToolModel(Long id, String nome, String descricao, String categoria, String estadoConservacao, Double valorDiaria, boolean disponivel, Long ownerId) {
        this.id = id;
        this.nome = nome;
        this.descricao = descricao;
        this.categoria = categoria;
        this.estadoConservacao = estadoConservacao;
        this.valorDiaria = valorDiaria;
        this.disponivel = disponivel;
        this.ownerId = ownerId;
    }
}