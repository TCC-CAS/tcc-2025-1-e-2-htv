package com.devolva.use.users.scheduler;

import com.devolva.use.users.usecases.UserUsecases;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class UserScheduler {

    private final UserUsecases userUsecases;

    public UserScheduler(UserUsecases userUsecases) {
        this.userUsecases = userUsecases;
    }

    @Scheduled(cron = "0 0 0 1 * *")
    public void executarResetMensalDeCreditos() {
        userUsecases.renovarCreditosMensais();
    }
}