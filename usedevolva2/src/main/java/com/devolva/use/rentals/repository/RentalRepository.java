package com.devolva.use.rentals.repository;

import com.devolva.use.rentals.domain.RentalModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RentalRepository extends JpaRepository<RentalModel, Long> {
    // Não precisa declarar os métodos save, findAll, findById, etc.
    // O JpaRepository já entrega todos eles prontos.
}
