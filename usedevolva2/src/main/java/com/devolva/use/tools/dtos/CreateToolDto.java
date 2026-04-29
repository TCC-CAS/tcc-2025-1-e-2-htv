package com.devolva.use.tools.dtos;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateToolDto(
        String nome,
        String descricao,
        String categoria,
        String estadoConservacao,
        BigDecimal valorDiaria,
        int quantidadeFotos,
        String localizacao,
        LocalDate dataInicioDisponibilidade,
        LocalDate dataFimDisponibilidade,
        String observacoes
) {}