package com.devolva.use1;

import com.devolva.use.users.domain.UserModel;
import com.devolva.use.users.domain.UserStatus;
import com.devolva.use.users.dtos.CreateUserDto;
import com.devolva.use.users.dtos.LoginUserDto;
import com.devolva.use.users.dtos.UpdateUserDto;
import com.devolva.use.users.dtos.VerifyUserDto;
import com.devolva.use.users.repository.UserRepository;
import com.devolva.use.users.usecases.UserUsecases;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

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
                true,
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
        assertTrue(user.isDeclarouMaiorIdade()); // Garante que salvou a maioridade
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
        // AJUSTADO: Trocado LocalDate por true aqui também
        CreateUserDto invalidDto = new CreateUserDto(
                "Thiago",
                "thiago@email.com",
                "11999999999",
                "123",
                "12345678900",
                true, // declarouMaiorIdade
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
    @DisplayName("Deve lançar erro quando não declarar maioridade")
    void shouldThrowExceptionWhenNotDeclaringAge() {
        CreateUserDto noAgeDto = new CreateUserDto(
                "Thiago Gatti",
                "thiago@email.com",
                "11999999999",
                "senha123",
                "12345678900",
                false, // declarouMaiorIdade = false
                true,
                true
        );

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> userUsecases.createUser(noAgeDto)
        );

        assertEquals("Você precisa declarar que é maior de 18 anos.", ex.getMessage());
    }

    @Test
    @DisplayName("Deve fazer login com sucesso