package com.devolva.use.rentals.dtos;

public record ApproveRentalDto(
        Long ownerId,
        Boolean approved
) {
}