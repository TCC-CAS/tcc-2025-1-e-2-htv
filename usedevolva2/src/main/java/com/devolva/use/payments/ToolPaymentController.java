package com.devolva.use.payments;

import com.devolva.use.payments.dtos.CreateToolPaymentDto;
import com.devolva.use.payments.usecases.PaymentUsecases;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/tool-payments")
public class ToolPaymentController {

    private final PaymentUsecases paymentUsecases;

    public ToolPaymentController(PaymentUsecases paymentUsecases) {
        this.paymentUsecases = paymentUsecases;
    }

    @PostMapping("/create")
    public ResponseEntity<?> create(
            @RequestBody CreateToolPaymentDto dto
    ) {
        return ResponseEntity.ok(
                paymentUsecases.createToolPixPayment(dto)
        );
    }

    @GetMapping("/check/{paymentId}")
    public ResponseEntity<?> checkPayment(
            @PathVariable Long paymentId
    ) {
        return ResponseEntity.ok(
                paymentUsecases.syncToolPaymentStatus(paymentId)
        );
    }


}