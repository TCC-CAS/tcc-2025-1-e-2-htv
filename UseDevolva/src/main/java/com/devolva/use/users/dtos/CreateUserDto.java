package com.devolva.use.users.dtos;

public record CreateUserDto(
        String nomeCompleto,
        String email,
        String telefone,
        String senha,
        String documento
) {
}