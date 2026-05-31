package com.devolva.use;

import com.devolva.use.security.dtos.AdminDto;
import com.devolva.use.security.usecases.AdminUsecases;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.EnableAsync;
import com.devolva.use.security.dtos.AdminDto;
import com.devolva.use.security.usecases.AdminUsecases;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableAsync;

@EnableAsync
@SpringBootApplication
public class Application {

	public static void main(String[] args) {
		SpringApplication.run(Application.class, args);
	}

	@Bean
	CommandLineRunner initAdmin(AdminUsecases adminUsecases) {
		return args -> {
			try {
				AdminDto defaultAdmin = new AdminDto(
						"admin@admin.com",
						"admin123",
						"Administrador Padrão",
						true
				);

				adminUsecases.createAdmin(defaultAdmin);
				System.out.println("======> Administrador padrão criado com sucesso! <======");

			} catch (IllegalArgumentException e) {
				System.out.println("======> Admin padrão já existente: " + e.getMessage() + " <======");
			} catch (Exception e) {
				System.err.println("Erro ao tentar criar o admin padrão: " + e.getMessage());
			}
		};
	}
}


