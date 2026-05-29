package com.devolva.use.web;

import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.webmvc.error.ErrorController;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import java.util.Map;


@Controller
public class AuthController implements ErrorController {

    @GetMapping("/")
    public String home() {
        return "home/home";
    }

    @GetMapping("/auth/login")
    public String login() {
        return "auth/login";
    }

    @GetMapping("/auth/register")
    public String register() {
        return "auth/register";
    }

    @GetMapping("/auth/logout")
    public String logout() {
        return "redirect:/auth/login";
    }

    @GetMapping("/home")
    public String homePage() {
        return "home/home";
    }
    @GetMapping("/users/profile")
    public String profile() {
        return "users/profile";
    }

    @GetMapping("/users/edit-profile")
    public String editProfile() {
        return "users/edit-profile";
    }

    @GetMapping("/users/my-tools")
    public String myTools() {
        return "users/my-tools";
    }

    @GetMapping("/users/create-tool")
    public String createTool() {
        return "users/create-tool";
    }

    @GetMapping("/users/edit-tool/{id}")
    public String editToolPage(@PathVariable Long id, Model model) {
        model.addAttribute("toolId", id);
        return "users/edit-tool";
    }

    @GetMapping("/tools/page/{id}")
    public String toolPage(@PathVariable Long id, Model model) {
        model.addAttribute("toolId", id);
        return "tools/tools-page";
    }

    @GetMapping("/tools/tools-list")
    public String toolsList() {
        return "tools/tools-list";
    }

    @GetMapping("/payment/success")
    public String paymentSuccessPage() {
        System.out.println("ROTA /payment/success CHAMADA");
        return "payments/payment-success";
    }

    @GetMapping("/users/my-rentals")
    public String myRentalsPage() {
        return "users/my-rentals";
    }

    @GetMapping("/users/chats")
    public String chatsPage() {
        return "users/chats";
    }

    @GetMapping("/rentals/tracking/{id}")
    public String rentalTrackingPage(@PathVariable Long id, Model model) {
        model.addAttribute("rentalId", id);
        return "rentals/rental-tracking";
    }

    @GetMapping("/rentals/requests")
    public String rentalRequestsPage() {
        return "rentals/rental-requests";
    }

    @GetMapping("/institutional/faq")
    public String faqPage() {
        return "institutional/faq";
    }

    @GetMapping("/institutional/termos-de-uso")
    public String termsPage() {
        return "institutional/termos-de-uso";
    }

    @GetMapping("/institutional/politica-de-privacidade")
    public String privacyPage() {
        return "institutional/politica-de-privacidade";
    }

    @GetMapping("/favorites")
    public String favoritesPage() {
        return "users/favorites";
    }

    @GetMapping("/admin")
    public String adminLoginPage() {
        return "security/admin-login";
    }

    @GetMapping("/admin/dashboard")
    public String adminDashboardPage() {
        return "security/admin-dashboard";
    }

    @GetMapping("/auth/forgot-password")
    public String forgotPasswordPage() {
        return "auth/forgot-password";
    }

    @GetMapping("/auth/new-password")
    public String newPasswordPage(@RequestParam String token, Model model) {
        model.addAttribute("token", token);
        return "auth/new-password";
    }
    @RequestMapping("/error")
    public String handleError(HttpServletRequest request, Model model) {
        Object status = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);

        String errorTitle = "Ops! Algo deu errado.";
        String errorMsg = "Ocorreu um erro inesperado no sistema. Por favor, tente novamente.";
        String statusCode = "Erro";

        if (status != null) {
            Integer code = Integer.valueOf(status.toString());
            statusCode = code.toString();

            if (code == 404) {
                errorTitle = "Página Não Encontrada";
                errorMsg = "A página ou recurso que você está tentando acessar não existe, mudou de lugar ou foi removido.";
            } else if (code == 500) {
                errorTitle = "Erro Interno no Servidor";
                errorMsg = "Nossos servidores estão enfrentando alguma instabilidade. Nossa equipe técnica já foi alertada!";
            } else if (code == 403) {
                errorTitle = "Acesso Negado";
                errorMsg = "Você não tem permissão suficiente para visualizar esta área do sistema.";
            }
        }

        model.addAttribute("status", statusCode);
        model.addAttribute("errorTitle", errorTitle);
        model.addAttribute("errorMsg", errorMsg);

        return "error/error";
    }
}