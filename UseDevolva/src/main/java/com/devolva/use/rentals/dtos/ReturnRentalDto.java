package com.devolva.use.rentals.dtos;

import java.time.LocalDate;

public record ReturnRentalDto(
        Long ownerId,
        LocalDate actualReturnDate
) {
}