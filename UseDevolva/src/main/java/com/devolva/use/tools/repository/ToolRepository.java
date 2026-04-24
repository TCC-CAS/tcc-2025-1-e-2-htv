package com.devolva.use.tools.repository;

import com.devolva.use.tools.domain.ToolModel;

import java.util.List;
import java.util.Optional;

public interface ToolRepository { // adicionar jpa repository para conexão com bd depois
    ToolModel save(ToolModel tool);
    List<ToolModel> findAll();
    Optional<ToolModel> findById(Long id);
    List<ToolModel> findByOwnerId(Long ownerId);
    void deleteById(Long id);

    long countActiveToolsByOwnerId(Long ownerId);
}