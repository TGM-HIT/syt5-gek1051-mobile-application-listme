package com.oliwier.listmebackend.domain.service;

import com.oliwier.listmebackend.domain.model.User;
import com.oliwier.listmebackend.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Transactional
    public User getOrCreate(UUID userId) {
        return userRepository.findById(userId)
                .orElseGet(() -> userRepository.save(new User(userId)));
    }
}
