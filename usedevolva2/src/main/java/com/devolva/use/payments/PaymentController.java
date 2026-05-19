package com.devolva.use.payments;

import com.devolva.use.payments.dtos.AbacateWebhookDto;
import com.devolva.use.payments.dtos.CreateCheckoutDto;
import com.devolva.use.payments.usecases.PaymentUsecases;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/payments")
@CrossOrigin(origins = "*")
public class PaymentController {

    private final PaymentUsecases paymentUsecases;

    public PaymentController(PaymentUsecases paymentUsecases) {
        this.paymentUsecases = paymentUsecases;
    }

    @PostMapping("/checkout")
    public ResponseEntity<Map<String, Object>> createCheckout(
            @RequestBody CreateCheckoutDto dto
    ) {

        return ResponseEntity.ok(
                paymentUsecases.createCheckout(dto)
        );
    }

    @GetMapping("/{transactionId}/sync")
    public ResponseEntity<Map<String, Object>> syncPaymentStatus(
            @PathVariable String transactionId
    ) {
        return ResponseEntity.ok(paymentUsecases.syncPaymentStatus(transactionId));
    }
}