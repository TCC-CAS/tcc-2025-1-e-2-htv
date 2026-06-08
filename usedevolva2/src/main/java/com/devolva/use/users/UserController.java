package com.devolva.use.users;

import com.devolva.use.users.domain.UserModel;
import com.devolva.use.users.dtos.CreateUserDto;
import com.devolva.use.users.dtos.LoginUserDto;
import com.devolva.use.users.dtos.UpdateUserDto;
import com.devolva.use.users.dtos.VerifyUserDto;
import com.devolva.use.users.usecases.UserUsecases;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;


@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/users")
public class UserController {

    private final UserUsecases userUsecases;

    public UserController(UserUsecases userUsecases) {
        this.userUsecases = userUsecases;
    }

    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody CreateUserDto dto) {
        try {
            UserModel user = userUsecases.createUser(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(user);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginUserDto dto) {

        try {

            return ResponseEntity.ok(userUsecases.login(dto));

        } catch (IllegalArgumentException | IllegalStateException e) {

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(e.getMessage());
        }
    }

    @PatchMapping("/{id}/verify")
    public ResponseEntity<UserModel> verifyIdentity(@PathVariable Long id, @RequestBody VerifyUserDto dto) {
        return ResponseEntity.ok(userUsecases.verifyIdentity(id, dto));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> updateBasicData(@PathVariable Long id, @RequestBody UpdateUserDto dto) {
        try {
            return ResponseEntity.ok(userUsecases.updateBasicData(id, dto));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserModel> findById(@PathVariable Long id) {
        return ResponseEntity.ok(userUsecases.findById(id));
    }

    @PostMapping(value = "/{id}/profile-photo", consumes = {"multipart/form-data"})
    public ResponseEntity<?> updateProfilePhoto(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file
    ) {
        try {
            return ResponseEntity.ok(userUsecases.updateProfilePhoto(id, file));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}/profile-photo")
    public ResponseEntity<?> removeProfilePhoto(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(userUsecases.removeProfilePhoto(id));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }
    
}
