package com.devolva.use.security;

import com.devolva.use.reports.domain.ReportModel;
import com.devolva.use.reports.dtos.CreateReportDto;
import com.devolva.use.reports.usecases.ReportUsecases;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import com.devolva.use.payments.PaymentController;
import com.devolva.use.payments.usecases.PaymentUsecases;
import com.devolva.use.tools.usecases.ToolUsecases;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import java.util.Map;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import com.devolva.use.security.domain.AdminModel;
import com.devolva.use.security.dtos.AdminDto;
import com.devolva.use.security.dtos.AdminLoginRequest;
import com.devolva.use.security.usecases.AdminUsecases;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AdminController.class)
class AdminControllerTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @MockitoBean
    AdminUsecases adminUsecases;

    @Test
    void shouldLoginAdmin() throws Exception {

        AdminLoginRequest dto =
                new AdminLoginRequest("admin@email.com", "123");

        AdminModel admin = new AdminModel();
        admin.setAtivo(true);

        when(adminUsecases.authenticate(anyString(), anyString()))
                .thenReturn(admin);

        mockMvc.perform(post("/security/admin/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk());
    }

    @Test
    void shouldReturn401WhenLoginFails() throws Exception {

        AdminLoginRequest dto =
                new AdminLoginRequest("admin@email.com", "123");

        when(adminUsecases.authenticate(anyString(), anyString()))
                .thenThrow(new IllegalArgumentException());

        mockMvc.perform(post("/security/admin/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldCreateAdmin() throws Exception {

        AdminDto dto =
                new AdminDto(
                        "Admin",
                        "admin@email.com",
                        "123456",
                        true
                );

        when(adminUsecases.createAdmin(any()))
                .thenReturn(new AdminModel());

        mockMvc.perform(post("/security/admin/create")
                        .header("X-Admin-Id", 1L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk());
    }
}