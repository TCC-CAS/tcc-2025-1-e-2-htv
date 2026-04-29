package com.devolva.use.rentals.repository;

import com.devolva.use.rentals.domain.RentalModel;
import com.devolva.use.rentals.domain.RentalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RentalRepository extends JpaRepository<RentalModel, Long> {

    List<RentalModel> findByToolId(Long toolId);
    List<RentalModel> findByRenterIdAndStatusIn(Long renterId, List<RentalStatus> statuses);


}
