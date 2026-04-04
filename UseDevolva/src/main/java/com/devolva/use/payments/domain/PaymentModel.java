package com.devolva.use.payments.domain;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class PaymentModel {

    private Long id;
    private Long rentalId;

    private Double grossAmount;
    private Double serviceFee;
    private Double netAmount;

    private String paymentMethod;
    private String transactionId;

    private PaymentStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime confirmedAt;

    public PaymentModel() {
        this.status = PaymentStatus.PENDING;
        this.createdAt = LocalDateTime.now();
    }

    public PaymentModel(Long id, Long rentalId, Double grossAmount, Double serviceFee, Double netAmount,
                        String paymentMethod, String transactionId, PaymentStatus status,
                        LocalDateTime createdAt, LocalDateTime confirmedAt) {
        this.id = id;
        this.rentalId = rentalId;
        this.grossAmount = grossAmount;
        this.serviceFee = serviceFee;
        this.netAmount = netAmount;
        this.paymentMethod = paymentMethod;
        this.transactionId = transactionId;
        this.status = status;
        this.createdAt = createdAt;
        this.confirmedAt = confirmedAt;
    }
}