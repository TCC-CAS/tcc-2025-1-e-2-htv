package com.devolva.use.users.usecases;

import com.devolva.use.emails.EmailService;
import com.devolva.use.users.domain.UserModel;
import com.devolva.use.users.domain.UserStatus;
import com.devolva.use.users.dtos.CreateUserDto;
import com.devolva.use.users.dtos.LoginUserDto;
import com.devolva.use.users.dtos.UpdateUserDto;
import com.devolva.use.users.dtos.VerifyUserDto;
import com.devolva.use.users.repository.UserRepository;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.thymeleaf.context.Context;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Service
public class UserUsecases {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final Cloudinary cloudinary;


    public UserUsecases(UserRepository userRepository, BCryptPasswordEncoder passwordEncoder, EmailService emailService, Cloudinary cloudinary) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.cloudinary = cloudinary;
    }

    public UserModel createUser(CreateUserDto dto) {
        validateCreateUser(dto);

        if (userRepository.existsByEmail(dto.email())) {
            throw new IllegalArgumentException("E-mail já cadastrado.");
        }

        UserModel user = new UserModel();
        user.setNomeCompleto(dto.nomeCompleto());
        user.setEmail(dto.email());
        user.setTelefone(dto.telefone().trim());
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
            user.setNomeCompleto(dto.nomeCompleto().trim());
        }

        if (dto.email() != null && !dto.email().isBlank()) {
            String newEmail = dto.email().trim().toLowerCase();

            if (!newEmail.equalsIgnoreCase(user.getEmail()) && userRepository.existsByEmail(newEmail)) {
                throw new IllegalArgumentException("E-mail já cadastrado.");
            }

            user.setEmail(newEmail);
        }

        if (dto.telefone() != null && !dto.telefone().isBlank()) {
            validateTelefone(dto.telefone());
            user.setTelefone(dto.telefone().trim());
        }

        if (dto.novaSenha() != null && !dto.novaSenha().isBlank()) {
            if (dto.novaSenha().length() < 8) {
                throw new IllegalArgumentException("Nova senha deve ter no mínimo 8 caracteres.");
            }

            if (dto.senhaAtual() == null || dto.senhaAtual().isBlank()) {
                throw new IllegalArgumentException("Informe a senha atual para alterar a senha.");
            }

            if (!passwordEncoder.matches(dto.senhaAtual(), user.getSenha())) {
                throw new IllegalArgumentException("Senha atual inválida.");
            }

            user.setSenha(passwordEncoder.encode(dto.novaSenha()));
        }

        user.setUpdatedAt(LocalDateTime.now());

        return userRepository.save(user);
    }

    public UserModel updateProfilePhoto(Long userId, MultipartFile file) {
        UserModel user = findActiveUser(userId);

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Selecione uma imagem para o perfil.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("O arquivo precisa ser uma imagem válida.");
        }

        if (file.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("A imagem deve ter no máximo 5 MB.");
        }

        try {
            if (user.getProfileImagePublicId() != null && !user.getProfileImagePublicId().isBlank()) {
                try {
                    cloudinary.uploader().destroy(user.getProfileImagePublicId(), ObjectUtils.emptyMap());
                } catch (Exception ignored) {
                    // Se a imagem antiga não for removida, ainda assim salvamos a nova foto.
                }
            }

            Map uploadResult = cloudinary.uploader().upload(file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", "users/user_" + userId + "/profile",
                            "resource_type", "image",
                            "overwrite", true,
                            "transformation", "c_fill,g_face,w_400,h_400,q_auto,f_auto"
                    ));

            user.setProfileImageUrl((String) uploadResult.get("secure_url"));
            user.setProfileImagePublicId((String) uploadResult.get("public_id"));
            user.setUpdatedAt(LocalDateTime.now());

            return userRepository.save(user);
        } catch (IOException e) {
            throw new RuntimeException("Erro ao processar a imagem de perfil.", e);
        }
    }


    public UserModel removeProfilePhoto(Long userId) {
        UserModel user = findActiveUser(userId);

        if (user.getProfileImagePublicId() != null && !user.getProfileImagePublicId().isBlank()) {
            try {
                cloudinary.uploader().destroy(user.getProfileImagePublicId(), ObjectUtils.emptyMap());
            } catch (Exception ignored) {
                // Mesmo se o Cloudinary falhar, removemos a referência no perfil do usuário.
            }
        }

        user.setProfileImageUrl(null);
        user.setProfileImagePublicId(null);
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

        validateTelefone(dto.telefone());

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


    private void validateTelefone(String telefone) {
        String apenasNumeros = telefone == null ? "" : telefone.replaceAll("\\D", "");

        if (apenasNumeros.length() != 11) {
            throw new IllegalArgumentException("Telefone deve conter exatamente 11 números, incluindo DDD.");
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

        String resetUrl = "http://usedevolva.sa-east-1.elasticbeanstalk.com/auth/new-password?token=" + token;
        context.setVariable("link", resetUrl);

        emailService.enviarEmail(email, "Recuperação de Senha", "emails/reset-password-email", context);
    }
    public void resetPassword(String token, String newPassword) {
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("Token de recuperação não informado.");
        }

        if (newPassword == null || newPassword.length() < 8) {
            throw new IllegalArgumentException("A nova senha deve ter no mínimo 8 caracteres.");
        }

        UserModel user = userRepository.findByResetPasswordToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Link de recuperação inválido ou já utilizado."));

        LocalDateTime expiresAt = user.getResetPasswordTokenExpiresAt();
        if (expiresAt == null || expiresAt.isBefore(LocalDateTime.now())) {
            user.setResetPasswordToken(null);
            user.setResetPasswordTokenExpiresAt(null);
            userRepository.save(user);
            throw new IllegalArgumentException("Link de recuperação expirado. Solicite um novo e-mail de recuperação.");
        }

        user.setSenha(passwordEncoder.encode(newPassword));
        user.setResetPasswordToken(null);
        user.setResetPasswordTokenExpiresAt(null);
        userRepository.save(user);
    }

}