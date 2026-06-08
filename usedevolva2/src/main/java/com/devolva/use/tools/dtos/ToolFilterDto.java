package com.devolva.use.tools.dtos;

import java.math.BigDecimal;

public record ToolFilterDto(
        String busca,
        String categoria,
        String estadoConservacao,
        BigDecimal valorMinimo,
        BigDecimal valorMaximo,
        Boolean disponivel
) {}