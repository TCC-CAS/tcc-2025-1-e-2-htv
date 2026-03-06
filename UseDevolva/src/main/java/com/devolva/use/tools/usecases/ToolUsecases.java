package com.devolva.use.tools.usecases;

import com.devolva.use.tools.repository.ToolRepository;
import org.springframework.stereotype.Service;

@Service
public class ToolUsecases {

    private final ToolRepository toolRepository;

    public ToolUsecases(ToolRepository toolRepository) {
        this.toolRepository = toolRepository;
    }
}