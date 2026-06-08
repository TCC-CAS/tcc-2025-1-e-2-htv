package com.devolva.use.addresses.dtos;

public record CreateAddressDto(
        String nomeIdentificacao,
        String cep,
        String logradouro,
        String numero,
        String complemento,
        String bairro,
        String cidade,
        String estado,
        Boolean principal
) {}