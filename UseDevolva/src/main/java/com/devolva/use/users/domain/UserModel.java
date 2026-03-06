package com.devolva.use.users.domain;


import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserModel {

    private Long id;
    private String nomeCompleto;
    private String email;
    private String telefone;
    private String senha;
    private String documento;
    private boolean verificado;

    public UserModel() {
    }

    public UserModel(Long id, String nomeCompleto, String email, String telefone, String senha, String documento, boolean verificado) {
        this.id = id;
        this.nomeCompleto = nomeCompleto;
        this.email = email;
        this.telefone = telefone;
        this.senha = senha;
        this.documento = documento;
        this.verificado = verificado;
    }
}


