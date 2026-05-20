package com.devolva.use.payments.dtos;

import java.math.BigDecimal;

public record CreateToolCheckoutDto(
        Long userId,
        Long toolId,
        int days,
        BigDecimal baseValue,
        BigDecimal serviceFee,
        BigDecimal totalAmount
) {}
