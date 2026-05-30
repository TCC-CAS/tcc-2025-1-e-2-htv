package com.devolva.use.addresses;

import com.devolva.use.addresses.AddressController;
import com.devolva.use.addresses.usecases.AddressUsecases;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.web.servlet.MockMvc;
import org.mockito.Mock;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AddressController.class)
class AddressControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AddressUsecases addressUsecases;

    @Test
    void shouldReturnAddresses() throws Exception {

        when(addressUsecases.listByUser(1L))
                .thenReturn(List.of());

        mockMvc.perform(
                        get("/users/1/addresses")
                )
                .andExpect(status().isOk());
    }
}