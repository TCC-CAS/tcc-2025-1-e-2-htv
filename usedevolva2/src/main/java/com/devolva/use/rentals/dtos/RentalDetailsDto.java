package com.devolva.use.rentals.dtos;

public record RentalDetailsDto(

        Long rentalId,

        Long toolId,

        String toolName,

        String toolImage,

        Long ownerId,

        String ownerName,

        Long renterId,

        String renterName,

        String status,

        String startDate,

        String endDate,

        Double totalValue,

        boolean isOwner,

        boolean isRenter

) {
}