package com.devolva.use.security;

import com.devolva.use.security.domain.AdminModel;
import com.devolva.use.security.dtos.AdminDto; // Importando o DTO que criamos
import com.devolva.use.security.dtos.AdminLoginRequest;
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

    @PostMapping("/create")
    public ResponseEntity<?> createAdmin(@RequestBody AdminDto dto, @RequestHeader("X-Admin-Id") Long adminId) {
        try {
            AdminModel newAdmin = adminUsecases.createAdmin(dto);
            return ResponseEntity.ok(newAdmin);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Erro interno ao cadastrar o administrador.");
        }
    }
}