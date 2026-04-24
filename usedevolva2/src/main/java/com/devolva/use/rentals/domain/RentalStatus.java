package com.devolva.use.rentals.domain;

public enum RentalStatus {
    PENDING,
    REJECTED,
    AWAITING_PAYMENT,
    PAID,
    IN_USE,
    RETURNED,
    LATE_RETURNED,
    CANCELLED
}