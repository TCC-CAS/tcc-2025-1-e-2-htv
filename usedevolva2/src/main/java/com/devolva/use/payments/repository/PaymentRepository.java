package com.devolva.use.payments.repository;

import com.devolva.use.payments.domain.PaymentModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<PaymentModel, Long> {
    // O JpaRepository já traz save, findAll, findById e deleteById prontos.
    // Você não precisa declarar esses métodos manualmente aqui.
}
