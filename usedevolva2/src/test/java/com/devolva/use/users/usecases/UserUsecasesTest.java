package com.devolva.use.users.usecases;

import com.devolva.use.users.domain.UserModel;
import com.devolva.use.users.domain.UserStatus;
import com.devolva.use.users.dtos.CreateUserDto;
import com.devolva.use.users.dtos.LoginUserDto;
import com.devolva.use.users.dtos.UpdateUserDto;
import com.devolva.use.users.dtos.VerifyUserDto;
import com.devolva.use.users.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserUsecasesTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private BCryptPasswordEncoder passwordEncoder;

    @InjectMocks
    private UserUsecases userUsecases;

    private CreateUserDto validCreateDto;

    @BeforeEach
    void setUp() {
        validCreateDto = new CreateUserDto(
                "Thiago Gatti",
                "thiago@email.com",
                "11999999999",
                "senha123",
                "12345678900",
                LocalDate.now().minusYears(20),
                true,
                true
        );
    }

    @Test
    @DisplayName("Deve criar usuário com sucesso")
    void shouldCreateUserSuccessfully() {
        when(userRepository.existsByEmail(validCreateDto.email())).thenReturn(false);
        when(passwordEncoder.encode(validCreateDto.senha())).thenReturn("senhaCriptografada");
        when(userRepository.save(any(UserModel.class))).thenAnswer(i -> i.getArgument(0));

        UserModel user = userUsecases.createUser(validCreateDto);

        assertNotNull(user);
        assertEquals("Thiago Gatti", user.getNomeCompleto());
        assertEquals("thiago@email.com", user.getEmail());
        assertEquals(UserModel.Plano.FREE, user.getPlano());
        verify(userRepository, times(1)).save(any(UserModel.class));
    }

    @Test
    @DisplayName("Deve lançar erro para e-mail já cadastrado")
    void shouldThrowExceptionWhenEmailAlreadyExists() {
        when(userRepository.existsByEmail(validCreateDto.email())).thenReturn(true);

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> userUsecases.createUser(validCreateDto)
        );

        assertEquals("E-mail já cadastrado.", ex.getMessage());
    }

    @Test
    @DisplayName("Deve lançar erro para senha curta")
    void shouldThrowExceptionWhenPasswordIsTooShort() {
        CreateUserDto invalidDto = new CreateUserDto(
                "Thiago",
                "thiago@email.com",
                "11999999999",
                "123",
                "12345678900",
                LocalDate.now().minusYears(20),
                true,
                true
        );

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> userUsecases.createUser(invalidDto)
        );

        assertEquals("Senha deve ter no mínimo 8 caracteres.", ex.getMessage());
    }

    @Test
    @DisplayName("Deve fazer login com sucesso")
    void shouldLoginSuccessfully() {
        UserModel user = new UserModel();
        user.setEmail("thiago@email.com");
        user.setSenha("senhaCriptografada");
        user.setStatus(UserStatus.ATIVO);

        LoginUserDto dto = new LoginUserDto("thiago@email.com", "senha123");

        when(userRepository.findByEmail(dto.email())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(dto.senha(), user.getSenha())).thenReturn(true);

        UserModel result = userUsecases.login(dto);

        assertNotNull(result);
        assertEquals("thiago@email.com", result.getEmail());
    }

    @Test
    @DisplayName("Deve lançar erro para senha inválida")
    void shouldThrowExceptionWhenPasswordIsInvalid() {
        UserModel user = new UserModel();
        user.setSenha("senhaCriptografada");
        user.setStatus(UserStatus.ATIVO);

        LoginUserDto dto = new LoginUserDto("thiago@email.com", "senhaErrada");

        when(userRepository.findByEmail(dto.email())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(dto.senha(), user.getSenha())).thenReturn(false);

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> userUsecases.login(dto)
        );

        assertEquals("Senha inválida.", ex.getMessage());
    }

    @Test
    @DisplayName("Deve verificar identidade com sucesso")
    void shouldVerifyIdentitySuccessfully() {
        UserModel user = new UserModel();
        user.setId(1L);
        user.setStatus(UserStatus.ATIVO);

        VerifyUserDto dto = new VerifyUserDto("12345678900");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(UserModel.class))).thenAnswer(i -> i.getArgument(0));

        UserModel verifiedUser = userUsecases.verifyIdentity(1L, dto);

        assertTrue(verifiedUser.isVerificado());
        assertEquals("12345678900", verifiedUser.getDocumento());
    }

    @Test
    @DisplayName("Deve atualizar nome e telefone com sucesso")
    void shouldUpdateBasicDataSuccessfully() {
        UserModel user = new UserModel();
        user.setId(1L);
        user.setStatus(UserStatus.ATIVO);

        UpdateUserDto dto = new UpdateUserDto("Novo Nome", null, "11888888888", null, null);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(UserModel.class))).thenAnswer(i -> i.getArgument(0));

        UserModel updatedUser = userUsecases.updateBasicData(1L, dto);

        assertEquals("Novo Nome", updatedUser.getNomeCompleto());
        assertEquals("11888888888", updatedUser.getTelefone());
    }

    @Test
    void shouldThrowWhenUserNotFound() {
        LoginUserDto dto = new LoginUserDto("teste@email.com", "12345678");

        when(userRepository.findByEmail(dto.email()))
                .thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> userUsecases.login(dto)
        );

        assertEquals("Usuário não encontrado.", ex.getMessage());
    }

    @Test
    void shouldThrowWhenUserBlocked() {

        UserModel user = new UserModel();
        user.setEmail("teste@email.com");
        user.setSenha("senha");
        user.setStatus(UserStatus.BLOQUEADO);

        when(userRepository.findByEmail(user.getEmail()))
                .thenReturn(Optional.of(user));

        when(passwordEncoder.matches(any(), any()))
                .thenReturn(true);

        IllegalStateException ex = assertThrows(
                IllegalStateException.class,
                () -> userUsecases.login(
                        new LoginUserDto(user.getEmail(), "12345678")
                )
        );

        assertTrue(ex.getMessage().contains("bloqueada"));
    }

    @Test
    void shouldThrowWhenVerifyIdentityWithoutDocument() {

        UserModel user = new UserModel();
        user.setStatus(UserStatus.ATIVO);

        when(userRepository.findById(1L))
                .thenReturn(Optional.of(user));

        VerifyUserDto dto = new VerifyUserDto("");

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> userUsecases.verifyIdentity(1L, dto)
        );

        assertEquals("Documento é obrigatório.", ex.getMessage());
    }
    @Test
    void shouldThrowWhenEmailAlreadyExistsOnUpdate() {

        UserModel user = new UserModel();
        user.setStatus(UserStatus.ATIVO);
        user.setEmail("atual@email.com");

        when(userRepository.findById(1L))
                .thenReturn(Optional.of(user));

        when(userRepository.existsByEmail("novo@email.com"))
                .thenReturn(true);

        UpdateUserDto dto =
                new UpdateUserDto(
                        null,
                        "novo@email.com",
                        null,
                        null,
                        null
                );

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> userUsecases.updateBasicData(1L, dto)
        );

        assertEquals("E-mail já cadastrado.", ex.getMessage());
    }

    @Test
    void shouldThrowWhenCurrentPasswordIsInvalid() {

        UserModel user = new UserModel();
        user.setStatus(UserStatus.ATIVO);
        user.setSenha("hash");

        when(userRepository.findById(1L))
                .thenReturn(Optional.of(user));

        when(passwordEncoder.matches("senhaErrada", "hash"))
                .thenReturn(false);

        UpdateUserDto dto =
                new UpdateUserDto(
                        null,
                        null,
                        null,
                        "senhaErrada",
                        "novaSenha123"
                );

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> userUsecases.updateBasicData(1L, dto)
        );

        assertEquals("Senha atual inválida.", ex.getMessage());
    }
    @Test
    void shouldThrowWhenFindByIdNotFound() {

        when(userRepository.findById(1L))
                .thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> userUsecases.findById(1L)
        );

        assertEquals("Usuário não encontrado.", ex.getMessage());
    }
    @Test
    void shouldBlockUserSuccessfully() {

        UserModel user = new UserModel();
        user.setStatus(UserStatus.ATIVO);

        when(userRepository.findById(1L))
                .thenReturn(Optional.of(user));

        when(userRepository.save(any()))
                .thenAnswer(i -> i.getArgument(0));

        UserModel result = userUsecases.blockUser(1L);

        assertEquals(UserStatus.BLOQUEADO, result.getStatus());

        verify(userRepository).save(user);
    }

    @Test
    void shouldThrowWhenUserIsUnder18() {

        CreateUserDto dto = new CreateUserDto(
                "Thiago",
                "teste@email.com",
                "11999999999",
                "senha123",
                "12345678900",
                LocalDate.now().minusYears(17),
                true,
                true
        );

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> userUsecases.createUser(dto)
        );

        assertEquals(
                "Usuário deve ter no mínimo 18 anos.",
                ex.getMessage()
        );
    }



}