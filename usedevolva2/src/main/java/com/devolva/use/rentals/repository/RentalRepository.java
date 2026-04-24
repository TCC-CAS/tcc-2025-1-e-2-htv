package com.devolva.use.rentals.repository;

import com.devolva.use.rentals.domain.RentalModel;

import java.util.List;
import java.util.Optional;

public interface RentalRepository {
    RentalModel save(RentalModel rental);
    List<RentalModel> findAll();
    Optional<RentalModel> findById(Long id);
    void deleteById(Long id);
}