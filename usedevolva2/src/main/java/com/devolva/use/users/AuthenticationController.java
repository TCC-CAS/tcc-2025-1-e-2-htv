package com.devolva.use.users;

import com.devolva.use.users.usecases.UserUsecases;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/auth") // Caminho base: /auth
public class AuthenticationController {

    private final UserUsecases userUsecases;

    public AuthenticationController(UserUsecases userUsecases) {
        this.userUsecases = userUsecases;
    }

    @PostMapping("/request-recovery")
    public ResponseEntity<String> requestRecovery(@RequestBody Map<String, String> body) {
        userUsecases.requestPasswordReset(body.get("email"));
        return ResponseEntity.ok("E-mail de recuperação enviado com sucesso.");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        userUsecases.resetPassword(body.get("token"), body.get("newPassword"));
        return ResponseEntity.ok("Senha alterada com sucesso.");
    }
}