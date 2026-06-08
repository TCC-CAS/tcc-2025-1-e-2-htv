package com.devolva.use.rentals;

import com.devolva.use.rentals.domain.RentalModel;
import com.devolva.use.rentals.dtos.CreateRentalDto;
import com.devolva.use.rentals.usecases.RentalUsecases;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
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

@WebMvcTest(RentalController.class)
class RentalControllerTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @MockitoBean
    RentalUsecases rentalUsecases;

    @Test
    void shouldCreateRental() throws Exception {

        CreateRentalDto dto =
                new CreateRentalDto(
                        1L,
                        2L,
                        LocalDate.now().plusDays(1),
                        LocalDate.now().plusDays(5)
                );

        when(rentalUsecases.createRentalRequest(any()))
                .thenReturn(new RentalModel());

        mockMvc.perform(post("/rentals")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk());
    }

    @Test
    void shouldFindAllRentals() throws Exception {

        when(rentalUsecases.findAll())
                .thenReturn(List.of());

        mockMvc.perform(get("/rentals"))
                .andExpect(status().isOk());
    }

    @Test
    void shouldFindRentalById() throws Exception {

        when(rentalUsecases.findById(1L))
                .thenReturn(new RentalModel());

        mockMvc.perform(get("/rentals/1"))
                .andExpect(status().isOk());
    }
}