package com.devolva.use.addresses.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "addresses")
public class AddressModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long ownerId;

    private String nomeIdentificacao;

    private String cep;
    private String logradouro;
    private String numero;
    private String complemento;
    private String bairro;
    private String cidade;
    private String estado;

    private boolean principal;
    private boolean ativo;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public AddressModel() {
        this.ativo = true;
        this.principal = false;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public String getEnderecoCompleto() {
        String base = logradouro + ", " + numero;

        if (complemento != null && !complemento.isBlank()) {
            base += " - " + complemento;
        }

        return base + " - " + bairro + ", " + cidade + " - " + estado + " - CEP: " + cep;
    }
}