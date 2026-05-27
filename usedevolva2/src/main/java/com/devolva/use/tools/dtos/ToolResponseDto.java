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
        String ownerProfileImageUrl,
        boolean disponivel,
        String cep,
        String logradouro,
        String numero,
        String complemento,
        String bairro,
        String cidade,
        String estado,
        String localizacao
) {}