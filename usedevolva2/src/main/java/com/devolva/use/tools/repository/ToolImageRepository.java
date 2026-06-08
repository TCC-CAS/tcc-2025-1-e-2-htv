package com.devolva.use.tools.repository;

import com.devolva.use.tools.domain.ToolImageModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ToolImageRepository extends JpaRepository<ToolImageModel, Long> {

    List<ToolImageModel> findByToolId(Long toolId);

    boolean existsByToolId(Long toolId);

    @Modifying
    @Query("UPDATE ToolImageModel i SET i.principal = false WHERE i.toolId = :toolId")
    void clearPrincipalByToolId(@Param("toolId") Long toolId);
}