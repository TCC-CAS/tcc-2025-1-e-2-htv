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

        Long addressId,
        String localizacao,
        String cep,
        String logradouro,
        String numero,
        String complemento,
        String bairro,
        String cidade,
        String estado,

        LocalDate dataInicioDisponibilidade,
        LocalDate dataFimDisponibilidade,
        String observacoes
) {}