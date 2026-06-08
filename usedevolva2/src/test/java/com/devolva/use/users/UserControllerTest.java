package com.devolva.use.users;

import com.devolva.use.users.domain.UserModel;
import com.devolva.use.users.dtos.CreateUserDto;
import com.devolva.use.users.dtos.LoginUserDto;
import com.devolva.use.users.usecases.UserUsecases;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDate;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserController.class)
class UserControllerTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @MockitoBean
    UserUsecases userUsecases;

    @Test
    void shouldCreateUser() throws Exception {

        UserModel user = new UserModel();
        user.setId(1L);

        CreateUserDto dto = new CreateUserDto(
                "Thiago",
                "thiago@email.com",
                "11999999999",
                "12345678",
                "12345678901",
                LocalDate.of(2000,1,1),
                true,
                true
        );

        when(userUsecases.createUser(any()))
                .thenReturn(user);

        mockMvc.perform(post("/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated());
    }

    @Test
    void shouldLoginSuccessfully() throws Exception {

        UserModel user = new UserModel();

        LoginUserDto dto =
                new LoginUserDto("teste@email.com","12345678");

        when(userUsecases.login(any()))
                .thenReturn(user);

        mockMvc.perform(post("/users/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk());
    }

    @Test
    void shouldReturn401WhenLoginFails() throws Exception {

        LoginUserDto dto =
                new LoginUserDto("teste@email.com","12345678");

        when(userUsecases.login(any()))
                .thenThrow(new IllegalArgumentException("Senha inválida."));

        mockMvc.perform(post("/users/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isUnauthorized());
    }
}