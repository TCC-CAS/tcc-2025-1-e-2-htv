package com.devolva.use.payments;

import com.devolva.use.payments.PaymentController;
import com.devolva.use.payments.usecases.PaymentUsecases;
import com.devolva.use.tools.usecases.ToolUsecases;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PaymentController.class)
class PaymentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private PaymentUsecases paymentUsecases;

    @MockitoBean
    private ToolUsecases toolUsecases;

    @Test
    void shouldSyncPaymentStatus() throws Exception {

        when(paymentUsecases.syncPaymentStatus("abc"))
                .thenReturn(Map.of("success", true));

        mockMvc.perform(
                        get("/payments/abc/sync")
                )
                .andExpect(status().isOk());
    }
}