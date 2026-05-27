package com.devolva.use.users;

import com.devolva.use.users.usecases.UserUsecases;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthenticationController {

    private final UserUsecases userUsecases;

    public AuthenticationController(UserUsecases userUsecases) {
        this.userUsecases = userUsecases;
    }

    @PostMapping("/request-recovery")
    public ResponseEntity<?> requestRecovery(@RequestBody Map<String, String> body) {
        try {
            userUsecases.requestPasswordReset(body.get("email"));
            return ResponseEntity.ok("E-mail de recuperação enviado com sucesso.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erro interno.");
        }
    }


    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        try {
            userUsecases.resetPassword(body.get("token"), body.get("newPassword"));
            return ResponseEntity.ok("Senha alterada com sucesso.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erro interno ao alterar a senha.");
        }
    }
}