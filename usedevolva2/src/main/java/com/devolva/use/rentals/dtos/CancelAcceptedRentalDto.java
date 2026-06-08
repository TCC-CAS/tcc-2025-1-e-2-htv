package com.devolva.use.rentals.dtos;

public record CancelAcceptedRentalDto(
        Long renterId,
        String reason
) {}
