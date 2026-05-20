package com.devolva.use.payments.dtos;

import java.math.BigDecimal;

public record CreateToolCheckoutDto(
        Long userId,
        Long toolId,
        int days,
        String toolName,
        BigDecimal baseValue,
        BigDecimal serviceFee,
        BigDecimal totalAmount
) {}
