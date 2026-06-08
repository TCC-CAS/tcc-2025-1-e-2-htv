package com.devolva.use.payments.dtos;

import java.math.BigDecimal;

public record CreateToolPaymentDto(
        Long toolId,
        Long userId,
        String startDate,
        String endDate,
        String message
) {}