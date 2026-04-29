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
        return "auth/login";
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
}