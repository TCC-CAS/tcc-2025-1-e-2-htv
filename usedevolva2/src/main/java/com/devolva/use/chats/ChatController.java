package com.devolva.use.chats;

import com.devolva.use.chats.dtos.SendChatMessageDto;
import com.devolva.use.chats.usecases.ChatUsecases;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/chats")
public class ChatController {

    private final ChatUsecases chatUsecases;

    public ChatController(ChatUsecases chatUsecases) {
        this.chatUsecases = chatUsecases;
    }

    @PostMapping("/tools/{toolId}/start")
    public ResponseEntity<?> startToolChat(
            @PathVariable Long toolId,
            @RequestParam Long userId,
            @RequestBody(required = false) Map<String, String> body
    ) {
        String message = body != null ? body.get("message") : null;

        return ResponseEntity.ok(
                chatUsecases.createOrGetToolChat(toolId, userId, message)
        );
    }

    @PostMapping("/rentals/{rentalId}/start")
    public ResponseEntity<?> startRentalChat(@PathVariable Long rentalId) {
        return ResponseEntity.ok(
                chatUsecases.createOrGetRentalChat(rentalId)
        );
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> listUserChats(@PathVariable Long userId) {
        return ResponseEntity.ok(
                chatUsecases.listUserChats(userId)
        );
    }

    @GetMapping("/{chatId}")
    public ResponseEntity<?> getChatDetails(
            @PathVariable Long chatId,
            @RequestParam Long userId
    ) {
        return ResponseEntity.ok(
                chatUsecases.getChatDetails(chatId, userId)
        );
    }

    @PostMapping("/{chatId}/messages")
    public ResponseEntity<?> sendMessage(
            @PathVariable Long chatId,
            @RequestBody SendChatMessageDto dto
    ) {
        return ResponseEntity.ok(
                chatUsecases.sendMessage(chatId, dto)
        );
    }

    @GetMapping("/user/{userId}/unread-count")
    public ResponseEntity<?> unreadCount(@PathVariable Long userId) {
        return ResponseEntity.ok(
                Map.of("unreadCount", chatUsecases.getUnreadCount(userId))
        );
    }
}