package com.devolva.use.users.usecases;

import com.devolva.use.emails.EmailService;
import com.devolva.use.users.domain.UserModel;
import com.devolva.use.users.domain.UserStatus;
import com.devolva.use.users.dtos.CreateUserDto;
import com.devolva.use.users.dtos.LoginUserDto;
import com.devolva.use.users.dtos.UpdateUserDto;
import com.devolva.use.users.dtos.VerifyUserDto;
import com.devolva.use.users.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class UserUsecases {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final EmailService emailService;


    public UserUsecases(UserRepository userRepository, BCryptPasswordEncoder passwordEncoder, EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    public UserModel createUser(CreateUserDto dto) {
        validateCreateUser(dto);

        if (userRepository.existsByEmail(dto.email())) {
            throw new IllegalArgumentException("E-mail já cadastrado.");
        }

        UserModel user = new UserModel();
        user.setNomeCompleto(dto.nomeCompleto());
        user.setEmail(dto.email());
        user.setTelefone(dto.telefone());
        user.setSenha(passwordEncoder.encode(dto.senha()));
        user.setDocumento(dto.documento());
        user.setDataNascimento(dto.dataNascimento());
        user.setVerificado(false);
        user.setAceitouTermosUso(dto.aceitouTermosUso());
        user.setAceitouPoliticaPrivacidade(dto.aceitouPoliticaPrivacidade());
        user.setStatus(UserStatus.ATIVO);
        user.setPlano(UserModel.Plano.FREE);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        return userRepository.save(user);
    }

    public UserModel login(LoginUserDto dto) {
        UserModel user = userRepository.findByEmail(dto.email())
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado."));

        if (!passwordEncoder.matches(dto.senha(), user.getSenha())) {
            throw new IllegalArgumentException("Senha inválida.");
        }

        if (user.getStatus() != UserStatus.ATIVO) {
            throw new IllegalStateException("Usuário não está ativo.");
        }

        return user;
    }

    public UserModel verifyIdentity(Long userId, VerifyUserDto dto) {
        UserModel user = findActiveUser(userId);

        if (dto.documento() == null || dto.documento().isBlank()) {
            throw new IllegalArgumentException("Documento é obrigatório.");
        }

        user.setDocumento(dto.documento());
        user.setVerificado(true);
        user.setUpdatedAt(LocalDateTime.now());

        return userRepository.save(user);
    }

    public UserModel updateBasicData(Long userId, UpdateUserDto dto) {
        UserModel user = findActiveUser(userId);

        if (dto.nomeCompleto() != null && !dto.nomeCompleto().isBlank()) {
            user.setNomeCompleto(dto.nomeCompleto());
        }

        if (dto.telefone() != null && !dto.telefone().isBlank()) {
            user.setTelefone(dto.telefone());
        }

        user.setUpdatedAt(LocalDateTime.now());

        return userRepository.save(user);
    }

    public UserModel findById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado."));
    }

    private UserModel findActiveUser(Long userId) {
        UserModel user = findById(userId);

        if (user.getStatus() != UserStatus.ATIVO) {
            throw new IllegalStateException("Usuário não está ativo.");
        }

        return user;
    }

    private void validateCreateUser(CreateUserDto dto) {
        if (dto.nomeCompleto() == null || dto.nomeCompleto().isBlank()) {
            throw new IllegalArgumentException("Nome completo é obrigatório.");
        }

        if (dto.email() == null || dto.email().isBlank()) {
            throw new IllegalArgumentException("E-mail é obrigatório.");
        }

        if (dto.telefone() == null || dto.telefone().isBlank()) {
            throw new IllegalArgumentException("Telefone é obrigatório.");
        }

        if (dto.senha() == null || dto.senha().length() < 8) {
            throw new IllegalArgumentException("Senha deve ter no mínimo 8 caracteres.");
        }

        if (dto.dataNascimento() == null || dto.dataNascimento().isAfter(LocalDate.now().minusYears(18))) {
            throw new IllegalArgumentException("Usuário deve ter no mínimo 18 anos.");
        }

        if (!dto.aceitouTermosUso()) {
            throw new IllegalArgumentException("Aceite dos termos de uso é obrigatório.");
        }

        if (!dto.aceitouPoliticaPrivacidade()) {
            throw new IllegalArgumentException("Aceite da política de privacidade é obrigatório.");
        }
    }

    public void requestPasswordReset(String email) {
        UserModel user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("E-mail não encontrado."));

        String token = UUID.randomUUID().toString();
        user.setResetPasswordToken(token);
        user.setResetPasswordTokenExpiresAt(LocalDateTime.now().plusHours(1));
        userRepository.save(user);

        Context context = new Context();
        String resetUrl = "http://usedevolva.sa-east-1.elasticbeanstalk.com/reset-password?token=" + token;
        context.setVariable("link", resetUrl);

        emailService.enviarEmail(email, "Recuperação de Senha", "emails/reset-password-email", context);
    }
    public void resetPassword(String token, String newPassword) {
        UserModel user = userRepository.findByResetPasswordToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Token inválido."));

        if (user.getResetPasswordTokenExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Token expirado.");
        }

        user.setSenha(passwordEncoder.encode(newPassword));
        user.setResetPasswordToken(null);
        user.setResetPasswordTokenExpiresAt(null);
        userRepository.save(user);
    }

}