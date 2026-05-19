package com.devolva.use.payments.dtos;

public record CreateCheckoutDto(
        Long userId,
        String plano
) {
}