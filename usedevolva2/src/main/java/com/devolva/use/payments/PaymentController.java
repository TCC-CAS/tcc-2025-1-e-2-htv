package com.devolva.use.payments;

import com.devolva.use.payments.dtos.AbacateWebhookDto;
import com.devolva.use.payments.dtos.CreateCheckoutDto;
import com.devolva.use.payments.usecases.PaymentUsecases;
import com.devolva.use.rentals.usecases.RentalUsecases;
import com.devolva.use.tools.domain.ToolModel;
import com.devolva.use.tools.usecases.ToolUsecases;
import com.devolva.use.users.domain.UserModel;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/payments")
@CrossOrigin(origins = "*")
public class PaymentController {

    private final PaymentUsecases paymentUsecases;
    private final ToolUsecases toolUsecases;
    private final RentalUsecases rentalUsecases;

    public PaymentController(PaymentUsecases paymentUsecases, ToolUsecases toolUsecases, RentalUsecases rentalUsecases) {
        this.paymentUsecases = paymentUsecases;
        this.toolUsecases = toolUsecases;
        this.rentalUsecases = rentalUsecases;
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
            @RequestParam Long rentalId,
            @RequestParam Long toolId,
            @RequestParam Long tenantId
    ) {
        try {
            ToolModel tool = toolUsecases.findToolOrThrow(toolId);

            UserModel tenant = paymentUsecases.findUserById(tenantId);

            Map<String, Object> response = paymentUsecases.createToolCheckout(rentalId, tool, tenant);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}