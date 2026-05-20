package com.devolva.use.tools.dtos;

import java.math.BigDecimal;
import java.time.LocalDate;

public record UpdateToolDto(
        String nome,
        String descricao,
        String categoria,
        String estadoConservacao,
        BigDecimal valorDiaria,
        int quantidadeFotos,
        Boolean disponivel,

        Long addressId,
        String localizacao,

        LocalDate dataInicioDisponibilidade,
        LocalDate dataFimDisponibilidade,
        String observacoes
) {}