package com.devolva.use.users.domain;

import com.fasterxml.jackson.annotation.JsonFormat;
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

    @Column(name = "profile_image_url", length = 1000)
    private String profileImageUrl;

    @Column(name = "profile_image_public_id")
    private String profileImagePublicId;

    @JsonIgnore
    private String senha;
    private String documento;

    private boolean declarouMaiorIdade;    private boolean verificado;
    private boolean aceitouTermosUso;
    private boolean aceitouPoliticaPrivacidade;

    @Enumerated(EnumType.STRING)
    private UserStatus status;
    @Enumerated(EnumType.STRING)
    private Plano plano;

    @Column(name = "plan_expires_at")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate planExpiresAt;


    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private String resetPasswordToken;
    private LocalDateTime resetPasswordTokenExpiresAt;
    
    public enum Plano {
        FREE, PRATA, OURO,
    }
    public UserModel() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.status = UserStatus.ATIVO;
        this.verificado = false;
        this.plano = Plano.FREE;
    }


}