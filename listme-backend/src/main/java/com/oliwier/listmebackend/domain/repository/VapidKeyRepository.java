package com.oliwier.listmebackend.domain.repository;

import com.oliwier.listmebackend.domain.model.VapidKey;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VapidKeyRepository extends JpaRepository<VapidKey, Short> {}
