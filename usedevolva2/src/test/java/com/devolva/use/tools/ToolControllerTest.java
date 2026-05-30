package com.devolva.use.tools;
import com.devolva.use.tools.dtos.ToolResponseDto;
import com.devolva.use.tools.usecases.ToolUsecases;
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
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ToolController.class)
class ToolControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    ToolUsecases toolUsecases;

    @Test
    void shouldListAvailableTools() throws Exception {

        when(toolUsecases.listAvailableTools())
                .thenReturn(List.of());

        mockMvc.perform(get("/tools"))
                .andExpect(status().isOk());
    }

    @Test
    void shouldFindToolById() throws Exception {

        ToolResponseDto dto =
                mock(ToolResponseDto.class);

        when(toolUsecases.findToolDetailsById(1L))
                .thenReturn(dto);

        mockMvc.perform(get("/tools/1"))
                .andExpect(status().isOk());
    }

    @Test
    void shouldDeleteTool() throws Exception {

        doNothing().when(toolUsecases)
                .deleteTool(1L, 1L);

        mockMvc.perform(delete("/tools/1/owner/1"))
                .andExpect(status().isNoContent());
    }
}