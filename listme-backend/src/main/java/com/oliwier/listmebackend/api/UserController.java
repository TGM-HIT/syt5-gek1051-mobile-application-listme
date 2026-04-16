package com.oliwier.listmebackend.api;

import com.oliwier.listmebackend.api.dto.UpdateUserRequest;
import com.oliwier.listmebackend.api.dto.UserResponse;
import com.oliwier.listmebackend.domain.model.User;
import com.oliwier.listmebackend.domain.repository.UserRepository;
import com.oliwier.listmebackend.identity.CurrentUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserController {

    private final UserRepository userRepository;

    @GetMapping("/me")
    public UserResponse me(@CurrentUser User user) {
        return UserResponse.from(user);
    }

    @PatchMapping("/me")
    @Transactional
    public UserResponse updateMe(@CurrentUser User user,
                                 @Valid @RequestBody UpdateUserRequest req) {
        if (req.displayName() != null) user.setDisplayName(req.displayName());
        if (req.profilePicture() != null) user.setProfilePicture(req.profilePicture());
        if (req.theme() != null) user.setTheme(req.theme());
        return UserResponse.from(userRepository.save(user));
    }
}
