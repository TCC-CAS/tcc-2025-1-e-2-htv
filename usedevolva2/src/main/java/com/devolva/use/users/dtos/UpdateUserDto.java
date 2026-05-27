package com.devolva.use.users.dtos;

public record UpdateUserDto(
        String nomeCompleto,
        String email,
        String telefone,
        String senhaAtual,
        String novaSenha
) {}
