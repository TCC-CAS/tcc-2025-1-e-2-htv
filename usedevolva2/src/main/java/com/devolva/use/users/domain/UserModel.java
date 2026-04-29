package com.devolva.use.users.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnore;


@Getter
@Setter
@Entity
@Table(name = "users")
public class UserModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nomeCompleto;

    @Column(unique = true, nullable = false)
    private String email;

    private String telefone;

    @JsonIgnore
    private String senha;
    private String documento;
    private LocalDate dataNascimento;
    private boolean verificado;
    private boolean aceitouTermosUso;
    private boolean aceitouPoliticaPrivacidade;

    @Enumerated(EnumType.STRING)
    private UserStatus status;
    @Enumerated(EnumType.STRING)
    private Plano plano;


    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public enum Plano {
        FREE, BRONZE, PRATA, OURO, DIAMANTE
    }
    public UserModel() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.status = UserStatus.ATIVO;
        this.verificado = false;
        this.plano = Plano.FREE;
    }


}