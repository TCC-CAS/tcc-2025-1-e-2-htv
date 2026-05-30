package com.devolva.use.security.usecases;

import com.devolva.use.security.domain.AdminModel;
import com.devolva.use.security.dtos.AdminDto;
import com.devolva.use.security.repository.AdminRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Field;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminUsecasesTest {

    @Mock
    AdminRepository adminRepository;

    @InjectMocks
    AdminUsecases adminUsecases;

    @Test
    void shouldCreateAdmin() {

        AdminDto dto =
                new AdminDto(
                        "Admin",
                        "admin@email.com",
                        "123456",
                        true
                );

        when(adminRepository.findByEmail(dto.email()))
                .thenReturn(Optional.empty());

        when(adminRepository.save(any()))
                .thenAnswer(invocation -> invocation.getArgument(0));

        AdminModel result = adminUsecases.createAdmin(dto);

        assertEquals(dto.email(), result.getEmail());
    }

    @Test
    void shouldThrowWhenEmailAlreadyExists() {

        AdminDto dto =
                new AdminDto(
                        "Admin",
                        "admin@email.com",
                        "123456",
                        true
                );

        when(adminRepository.findByEmail(dto.email()))
                .thenReturn(Optional.of(new AdminModel()));

        assertThrows(
                IllegalArgumentException.class,
                () -> adminUsecases.createAdmin(dto)
        );
    }

    @Test
    void shouldThrowWhenAdminNotFound() {

        when(adminRepository.findByEmail("admin@email.com"))
                .thenReturn(Optional.empty());

        assertThrows(
                IllegalArgumentException.class,
                () -> adminUsecases.authenticate("admin@email.com", "123456")
        );
    }

    @Test
    void shouldThrowWhenPasswordIsIncorrect() {

        AdminModel admin = new AdminModel();
        admin.setEmail("admin@email.com");
        admin.setSenha("encoded-password");

        when(adminRepository.findByEmail("admin@email.com"))
                .thenReturn(Optional.of(admin));

        assertThrows(
                IllegalArgumentException.class,
                () -> adminUsecases.authenticate("admin@email.com", "wrong-password")
        );
    }

    @Test
    void shouldAuthenticateSuccessfully() {

        AdminUsecases usecases = new AdminUsecases();

        AdminDto dto = new AdminDto(
                "Admin",
                "admin@email.com",
                "123456",
                true
        );

        AdminModel saved = new AdminModel();
        saved.setEmail(dto.email());
        saved.setSenha(new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder()
                .encode(dto.senha()));

        when(adminRepository.findByEmail(dto.email()))
                .thenReturn(Optional.of(saved));

        AdminModel result = adminUsecases.authenticate(dto.email(), dto.senha());

        assertNotNull(result);
        assertEquals(dto.email(), result.getEmail());
    }

    @Test
    void shouldCreateAdminSuccessfully() {

        AdminDto dto = new AdminDto(
                "Admin",
                "admin@email.com",
                "123456",
                true
        );

        when(adminRepository.findByEmail(dto.email()))
                .thenReturn(Optional.empty());

        when(adminRepository.save(any(AdminModel.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        AdminModel result = adminUsecases.createAdmin(dto);

        assertEquals(dto.email(), result.getEmail());
        assertEquals(dto.nome(), result.getNome());

        assertNotNull(result.getSenha());
        assertNotEquals("123456", result.getSenha());
    }

    @Test
    void shouldEncryptPasswordDifferentlyEveryTime() {

        AdminDto dto = new AdminDto(
                "Admin",
                "admin@email.com",
                "123456",
                true
        );

        when(adminRepository.findByEmail(dto.email()))
                .thenReturn(Optional.empty());

        when(adminRepository.save(any()))
                .thenAnswer(invocation -> invocation.getArgument(0));

        AdminModel result1 = adminUsecases.createAdmin(dto);
        AdminModel result2 = adminUsecases.createAdmin(
                new AdminDto("Admin", "admin2@email.com", "123456", true)
        );

        assertNotEquals(result1.getSenha(), result2.getSenha());
    }

}