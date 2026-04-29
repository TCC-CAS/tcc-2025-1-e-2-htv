package com.devolva.use.security;

import com.devolva.use.security.dtos.AdminDto;
import com.devolva.use.security.domain.AdminModel;
import com.devolva.use.security.usecases.AdminUsecases;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admins")
public class AdminController {

    @Autowired
    private AdminUsecases adminUsecases;

    // Endpoint para criar um admin
    @PostMapping("/create")
    public ResponseEntity<AdminModel> createAdmin(@RequestBody AdminDto dto) {
        AdminModel admin = adminUsecases.createAdmin(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(admin);
    }

    // Endpoint para autenticar admin
    @PostMapping("/login")
    public ResponseEntity<AdminModel> authenticate(@RequestBody AdminDto dto) {
        AdminModel admin = adminUsecases.authenticate(dto.email(), dto.senha());
        return ResponseEntity.ok(admin);
    }
}