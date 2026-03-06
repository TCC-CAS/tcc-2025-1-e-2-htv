package com.devolva.use.tools.domain;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ToolModel {

    private Long id;
    private String nome;
    private String descricao;
    private Long categoriaId;
    private String estadoConservacao;
    private Double valorDiaria;
    private boolean disponivel;
    private Long proprietarioId;

    public ToolModel() {
    }

    public ToolModel(Long id, String nome, String descricao, Long categoriaId, String estadoConservacao, Double valorDiaria, boolean disponivel, Long proprietarioId) {
        this.id = id;
        this.nome = nome;
        this.descricao = descricao;
        this.categoriaId = categoriaId;
        this.estadoConservacao = estadoConservacao;
        this.valorDiaria = valorDiaria;
        this.disponivel = disponivel;
        this.proprietarioId = proprietarioId;
    }
}