package com.devolva.use.tools.repository;

import com.devolva.use.tools.domain.ToolImageModel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ToolImageRepository extends JpaRepository<ToolImageModel, Long> {
    List<ToolImageModel> findByToolId(Long toolId);
}