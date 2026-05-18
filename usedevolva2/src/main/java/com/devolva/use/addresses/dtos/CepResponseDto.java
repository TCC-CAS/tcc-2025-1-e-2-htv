package com.devolva.use.addresses.dtos;

public record CepResponseDto(
        String cep,
        String logradouro,
        String complemento,
        String bairro,
        String localidade,
        String uf,
        Boolean erro
) {}