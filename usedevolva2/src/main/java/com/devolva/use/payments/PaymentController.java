package com.devolva.use.payments;

import com.devolva.use.payments.domain.PaymentModel;
import com.devolva.use.payments.dtos.ConfirmPaymentDto;
import com.devolva.use.payments.dtos.CreatePaymentDto;
import com.devolva.use.payments.usecases.PaymentUsecases;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/payments")
public class PaymentController {

    private final PaymentUsecases paymentUsecases;

    public PaymentController(PaymentUsecases paymentUsecases) {
        this.paymentUsecases = paymentUsecases;
    }

    @PostMapping
    public PaymentModel create(@RequestBody CreatePaymentDto dto) {
        return paymentUsecases.createPayment(dto);
    }

    @PutMapping("/{paymentId}/confirm")
    public PaymentModel confirm(
            @PathVariable Long paymentId,
            @RequestBody ConfirmPaymentDto dto
    ) {
        return paymentUsecases.confirmPayment(paymentId, dto);
    }

    @PutMapping("/{paymentId}/fail")
    public PaymentModel fail(@PathVariable Long paymentId) {
        return paymentUsecases.failPayment(paymentId);
    }

    @GetMapping("/{paymentId}")
    public PaymentModel findById(@PathVariable Long paymentId) {
        return paymentUsecases.findById(paymentId);
    }
}