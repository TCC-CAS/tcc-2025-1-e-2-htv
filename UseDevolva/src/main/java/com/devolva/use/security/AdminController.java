package com.devolva.use.security;

import com.devolva.use.security.usecases.AdminUsecases;

public class AdminController {

    private final AdminUsecases useCase;

    public AdminController(AdminUsecases useCase) {
        this.useCase = useCase;
    }
}
