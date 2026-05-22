package com.devolva.use.security;

import com.devolva.use.security.domain.AdminModel;
import com.devolva.use.security.dtos.AdminLoginRequest; // Criar um record simples
import com.devolva.use.security.usecases.AdminUsecases;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/security/admin")
public class AdminController {

    private final AdminUsecases adminUsecases;

    public AdminController(AdminUsecases adminUsecases) {
        this.adminUsecases = adminUsecases;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AdminLoginRequest dto) {
        try {
            AdminModel admin = adminUsecases.authenticate(dto.email(), dto.senha());

            if (!admin.isAtivo()) {
                return ResponseEntity.status(403).body("Este administrador está inativo.");
            }

            return ResponseEntity.ok(admin);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).body(e.getMessage());
        }
    }
}