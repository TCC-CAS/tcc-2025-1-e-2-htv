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

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/users")
public class UserController {

    private final UserUsecases userUsecases;

    public UserController(UserUsecases userUsecases) {
        this.userUsecases = userUsecases;
    }

    @PostMapping
    public ResponseEntity<UserModel> createUser(@RequestBody CreateUserDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userUsecases.createUser(dto));
    }

    @PostMapping("/login")
    public ResponseEntity<UserModel> login(@RequestBody LoginUserDto dto) {
        return ResponseEntity.ok(userUsecases.login(dto));
    }

    @PatchMapping("/{id}/verify")
    public ResponseEntity<UserModel> verifyIdentity(@PathVariable Long id, @RequestBody VerifyUserDto dto) {
        return ResponseEntity.ok(userUsecases.verifyIdentity(id, dto));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<UserModel> updateBasicData(@PathVariable Long id, @RequestBody UpdateUserDto dto) {
        return ResponseEntity.ok(userUsecases.updateBasicData(id, dto));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserModel> findById(@PathVariable Long id) {
        return ResponseEntity.ok(userUsecases.findById(id));
    }

    
}