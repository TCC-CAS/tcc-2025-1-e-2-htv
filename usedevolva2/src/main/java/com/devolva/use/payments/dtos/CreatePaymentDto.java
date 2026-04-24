package com.devolva.use.payments.dtos;

public record CreatePaymentDto(
        Long rentalId,
        String paymentMethod
) {
}