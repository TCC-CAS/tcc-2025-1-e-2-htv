package com.devolva.use.users.dtos;

import java.time.LocalDate;

public record CreateUserDto(
        String nomeCompleto,
        String email,
        String telefone,
        String senha,
        String documento,
        boolean declarouMaiorIdade,
        boolean aceitouTermosUso,
        boolean aceitouPoliticaPrivacidade
){

}