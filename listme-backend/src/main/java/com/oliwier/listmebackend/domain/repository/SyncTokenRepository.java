package com.oliwier.listmebackend.domain.repository;

import com.oliwier.listmebackend.domain.model.SyncToken;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SyncTokenRepository extends JpaRepository<SyncToken, String> {
}
