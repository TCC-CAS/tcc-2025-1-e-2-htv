package com.devolva.use.tools.dtos;

import java.math.BigDecimal;
import java.time.LocalDate;

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
        String localizacao,

        String observacoes,
        LocalDate dataInicioDisponibilidade,
        LocalDate dataFimDisponibilidade

) {}