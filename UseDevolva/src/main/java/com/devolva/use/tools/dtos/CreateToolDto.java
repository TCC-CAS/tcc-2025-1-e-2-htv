package com.devolva.use.tools.dtos;

public record CreateToolDto(
        String nome,
        String descricao,
        String categoria,
        String estadoConservacao,
        Double valorDiaria,
        boolean disponivel,
        Long ownerId
) {
}