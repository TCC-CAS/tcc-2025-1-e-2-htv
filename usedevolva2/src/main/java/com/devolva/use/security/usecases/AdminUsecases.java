package com.devolva.use.security.usecases;

import com.devolva.use.security.domain.AdminModel;
import com.devolva.use.security.dtos.AdminDto;
import com.devolva.use.security.repository.AdminRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AdminUsecases {

    @Autowired
    private AdminRepository adminRepository;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AdminModel createAdmin(AdminDto dto) {
        if (adminRepository.findByEmail(dto.email()).isPresent()) {
            throw new IllegalArgumentException("O e-mail já está cadastrado.");
        }

        String encryptedPassword = passwordEncoder.encode(dto.senha());

        AdminModel admin = new AdminModel();
        admin.setEmail(dto.email());
        admin.setSenha(encryptedPassword);
        admin.setNome(dto.nome());
        admin.setAtivo(dto.ativo());

        return adminRepository.save(admin);
    }

    public AdminModel authenticate(String email, String senha) {
        Optional<AdminModel> optionalAdmin = adminRepository.findByEmail(email);

        if (optionalAdmin.isEmpty()) {
            throw new IllegalArgumentException("Admin não encontrado.");
        }

        AdminModel admin = optionalAdmin.get();

        if (!passwordEncoder.matches(senha, admin.getSenha())) {
            throw new IllegalArgumentException("Senha incorreta.");
        }

        return admin;
    }
}