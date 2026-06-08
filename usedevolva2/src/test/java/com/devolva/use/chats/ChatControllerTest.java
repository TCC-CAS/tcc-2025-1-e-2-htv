package com.devolva.use.chats;

import com.devolva.use.chats.ChatController;
import com.devolva.use.chats.usecases.ChatUsecases;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.springframework.test.context.bean.override.mockito.MockitoBean;

@WebMvcTest(ChatController.class)
class ChatControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ChatUsecases chatUsecases;

    @Test
    void shouldReturnUnreadCount() throws Exception {

        when(chatUsecases.getUnreadCount(1L))
                .thenReturn(5L);

        mockMvc.perform(
                        get("/chats/user/1/unread-count")
                )
                .andExpect(status().isOk());
    }
}