package com.devolva.use.rentals.domain;

public enum RentalStatus {
    PENDING,
    REJECTED,
    ACCEPTED,
    AWAITING_PAYMENT,
    PAID,
    IN_USE,
    RETURNED,
    LATE_RETURNED,
    CANCELLED,
    FINALIZED
}