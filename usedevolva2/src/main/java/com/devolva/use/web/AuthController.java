package com.devolva.use.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

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

}