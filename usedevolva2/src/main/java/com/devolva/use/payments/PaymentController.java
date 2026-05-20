package com.devolva.use.payments;

import com.devolva.use.payments.dtos.AbacateWebhookDto;
import com.devolva.use.payments.dtos.CreateCheckoutDto;
import com.devolva.use.payments.dtos.CreateToolCheckoutDto;
import com.devolva.use.payments.usecases.PaymentUsecases;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
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

    @GetMapping("/user/{userId}/pending")
    public ResponseEntity<Map<String, Object>> findLastPendingPayment(
            @PathVariable Long userId
    ) {
        return ResponseEntity.ok(paymentUsecases.findLastPendingPayment(userId));
    }
    @PostMapping("/tool-checkout")
    public ResponseEntity<Map<String, Object>> createToolCheckout(
            @RequestParam Long toolId,
            @RequestParam int days,
            @RequestParam BigDecimal totalAmount,
            @RequestParam Long tenantId
    ) {
        CreateToolCheckoutDto dto = new CreateToolCheckoutDto(
                tenantId,
                toolId,
                days,
                null,
                null,
                totalAmount
        );

        return ResponseEntity.ok(paymentUsecases.createToolCheckout(dto));
    }

}