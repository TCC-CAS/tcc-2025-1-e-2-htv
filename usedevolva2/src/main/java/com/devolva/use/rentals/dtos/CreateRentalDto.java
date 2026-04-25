package com.devolva.use.rentals.dtos;

import java.time.LocalDate;

public record CreateRentalDto(
        Long toolId,
        Long tenantId,
        LocalDate startDate,
        LocalDate endDate
) {
}