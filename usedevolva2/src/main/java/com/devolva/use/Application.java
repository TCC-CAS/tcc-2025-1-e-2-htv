package com.devolva.use;

import com.devolva.use.security.dtos.AdminDto;
import com.devolva.use.security.usecases.AdminUsecases;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class Application {

	public static void main(String[] args) {
		SpringApplication.run(Application.class, args);
	}


	@Bean
    CommandLineRunner initAdmin(AdminUsecases adminUsecases) {
		return args -> {
			try {
				AdminDto novoAdmin = new AdminDto(
						"admin@admin.com",
						"admin123",
						"Admin",
						true
				);

				adminUsecases.createAdmin(novoAdmin);
				System.out.println("✅ ADMINISTRADOR CRIADO COM SUCESSO NO JAVALAND!");
			} catch (IllegalArgumentException e) {
				System.out.println("ℹ️ Admin já estava cadastrado: " + e.getMessage());
			}
		};
	}

}
