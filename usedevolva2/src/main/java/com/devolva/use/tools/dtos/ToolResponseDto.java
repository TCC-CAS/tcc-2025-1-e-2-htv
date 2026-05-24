package com.devolva.use.tools.dtos;

import java.math.BigDecimal;

public record ToolResponseDto(
        Long id,
        String nome,
        String descricao,
        String categoria,
        String estadoConservacao,
        BigDecimal valorDiaria,
        Long ownerId,
        String ownerNome,
        String ownerPlano,
        boolean disponivel,
        String cidade,
        String estado,
        String localizacao

) {}