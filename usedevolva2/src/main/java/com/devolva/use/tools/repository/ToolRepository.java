package com.devolva.use.tools.repository;

import com.devolva.use.tools.domain.ToolModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ToolRepository extends JpaRepository<ToolModel, Long> {

    List<ToolModel> findByOwnerId(Long ownerId);

    // O Spring entenderá que deve contar registros onde:
    // ownerId = ? AND ativo = true
    long countByOwnerIdAndAtivoTrue(Long ownerId);

    // Para manter o nome que você já usa no Usecase, podemos fazer assim:
    default long countActiveToolsByOwnerId(Long ownerId) {
        return countByOwnerIdAndAtivoTrue(ownerId);
    }
}
