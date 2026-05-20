package com.devolva.use.rentals.dtos;

public record RentalListDto(

        Long rentalId,

        Long toolId,

        String toolName,

        String toolImage,

        String ownerName,

        String status,

        String startDate,

        String endDate,

        Double totalValue

) {
}