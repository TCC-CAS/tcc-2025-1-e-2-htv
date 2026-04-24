package com.devolva.use.tools.dtos;

import java.math.BigDecimal;

public record CreateToolDto(
        String nome,
        String descricao,
        String categoria,
        String estadoConservacao,
        BigDecimal valorDiaria,
        int quantidadeFotos
) {}