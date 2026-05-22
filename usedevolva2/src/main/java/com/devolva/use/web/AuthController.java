package com.devolva.use.web;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@Controller
public class AuthController {

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

    @GetMapping("/home")
    public String homePage() {
        return "home/home";
    }
    @GetMapping("/users/profile")
    public String profile() {
        return "users/profile";
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


}