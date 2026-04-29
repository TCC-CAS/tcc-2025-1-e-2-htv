package com.devolva.use.tools.repository;

import com.devolva.use.tools.domain.ToolModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ToolRepository extends JpaRepository<ToolModel, Long> {

    List<ToolModel> findByOwnerId(Long ownerId);


    long countByOwnerIdAndAtivoTrue(Long ownerId);
    List<ToolModel> findByAtivoTrueAndDisponivelTrue();
    default long countActiveToolsByOwnerId(Long ownerId) {
        return countByOwnerIdAndAtivoTrue(ownerId);
    }
}
