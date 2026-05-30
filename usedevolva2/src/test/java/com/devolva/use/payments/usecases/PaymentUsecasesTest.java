package com.devolva.use.payments.usecases;

import com.devolva.use.chats.usecases.ChatUsecases;
import com.devolva.use.payments.domain.PaymentModel;
import com.devolva.use.payments.domain.PaymentStatus;
import com.devolva.use.payments.repository.PaymentRepository;
import com.devolva.use.payments.usecases.PaymentUsecases;
import com.devolva.use.rentals.repository.RentalRepository;
import com.devolva.use.tools.repository.ToolRepository;
import com.devolva.use.users.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.Map;
import java.util.Optional;

import static org.mockito.Mockito.when;
import static org.springframework.test.util.AssertionErrors.assertEquals;

@ExtendWith(MockitoExtension.class)
class PaymentUsecasesTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ToolRepository toolRepository;

    @Mock
    private RentalRepository rentalRepository;

    @Mock
    private ChatUsecases chatUsecases;

    @InjectMocks
    private PaymentUsecases paymentUsecases;

    @Test
    void shouldFindPendingPayment() {

        PaymentModel payment = new PaymentModel();

        payment.setTransactionId("abc123");

        when(
                paymentRepository
                        .findTopByUserIdAndStatusOrderByCreatedAtDesc(
                                1L,
                                PaymentStatus.PENDING
                        )
        ).thenReturn(Optional.of(payment));

        Map<String,Object> result =
                paymentUsecases.findLastPendingPayment(1L);

        assertEquals(
                true,
                result.get("success")
        );

        assertEquals(
                "abc123",
                result.get("transactionId")
        );
    }
}