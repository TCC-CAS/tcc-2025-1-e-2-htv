package com.devolva.use.categories.domain;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CategoryModel {

    private Long id;
    private String nome;
    private String descricao;

    public CategoryModel() {
    }

    public CategoryModel(Long id, String nome, String descricao) {
        this.id = id;
        this.nome = nome;
        this.descricao = descricao;
    }
}