package com.devolva.use.reports;

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

@WebMvcTest(ReportController.class)
class ReportControllerTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @MockitoBean
    ReportUsecases reportUsecases;

    @Test
    void shouldCreateReport() throws Exception {

        CreateReportDto dto = new CreateReportDto(
                1L,2L,3L,4L,
                "SPAM",
                "Descrição",
                "Mensagens"
        );

        when(reportUsecases.createReport(any()))
                .thenReturn(new ReportModel());

        mockMvc.perform(post("/reports/create")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated());
    }

    @Test
    void shouldListReports() throws Exception {

        when(reportUsecases.listAllReports())
                .thenReturn(List.of());

        mockMvc.perform(get("/reports/admin/list"))
                .andExpect(status().isOk());
    }

    @Test
    void shouldResolveReport() throws Exception {

        when(reportUsecases.resolveReport(anyLong(), anyLong(), anyString()))
                .thenReturn(new ReportModel());

        mockMvc.perform(
                        put("/reports/admin/1/resolve")
                                .header("X-Admin-Id", 1L)
                                .param("action", "RESOLVE")
                )
                .andExpect(status().isOk());
    }
}