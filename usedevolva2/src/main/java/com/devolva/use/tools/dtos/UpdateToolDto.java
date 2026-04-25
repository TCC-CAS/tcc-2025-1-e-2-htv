package com.devolva.use.tools.dtos;

import java.math.BigDecimal;

public record UpdateToolDto(
        String nome,
        String descricao,
        String categoria,
        String estadoConservacao,
        BigDecimal valorDiaria,
        int quantidadeFotos,
        Boolean disponivel
) {}