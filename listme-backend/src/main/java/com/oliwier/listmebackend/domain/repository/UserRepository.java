package com.oliwier.listmebackend.domain.repository;

import com.oliwier.listmebackend.domain.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
}
