package com.oliwier.listmebackend.domain.service;

import com.oliwier.listmebackend.api.dto.CreateFavoriteRequest;
import com.oliwier.listmebackend.domain.model.Device;
import com.oliwier.listmebackend.domain.model.Favorite;
import com.oliwier.listmebackend.domain.repository.FavoriteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FavoriteServiceTest {

    @Mock FavoriteRepository favoriteRepository;

    @InjectMocks FavoriteService favoriteService;

    UUID devId = UUID.randomUUID();
    UUID favId = UUID.randomUUID();
    Device device;

    @BeforeEach
    void setUp() {
        device = new Device(devId);
    }

    private Favorite fav(String name) {
        Favorite f = new Favorite();
        f.setId(UUID.randomUUID());
        f.setDevice(device);
        f.setItemName(name);
        return f;
    }

    @Test
    void getMyFavorites_returnsUpToTen() {
        List<Favorite> many = List.of(fav("a"), fav("b"), fav("c"));
        when(favoriteRepository.findByDeviceIdOrderByCreatedAtDesc(devId)).thenReturn(many);
        assertThat(favoriteService.getMyFavorites(device)).hasSize(3);
    }

    @Test
    void create_savesNewFavorite_whenNotDuplicate() {
        when(favoriteRepository.existsByDeviceIdAndItemName(devId, "Milk")).thenReturn(false);
        when(favoriteRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Favorite result = favoriteService.create(device, new CreateFavoriteRequest("Milk", "🥛"));

        assertThat(result.getItemName()).isEqualTo("Milk");
        verify(favoriteRepository).save(any());
    }

    @Test
    void create_returnsExisting_whenDuplicate() {
        Favorite existing = fav("Milk");
        when(favoriteRepository.existsByDeviceIdAndItemName(devId, "Milk")).thenReturn(true);
        when(favoriteRepository.findByDeviceIdOrderByCreatedAtDesc(devId)).thenReturn(List.of(existing));

        Favorite result = favoriteService.create(device, new CreateFavoriteRequest("Milk", "🥛"));

        assertThat(result).isSameAs(existing);
        verify(favoriteRepository, never()).save(any());
    }

    @Test
    void delete_removesOwnFavorite() {
        Favorite f = fav("Milk"); f.setId(favId);
        when(favoriteRepository.findById(favId)).thenReturn(Optional.of(f));

        favoriteService.delete(favId, device);

        verify(favoriteRepository).delete(f);
    }

    @Test
    void delete_throwsForbidden_whenNotOwner() {
        Device other = new Device(UUID.randomUUID());
        Favorite f = new Favorite(); f.setId(favId); f.setDevice(other);
        when(favoriteRepository.findById(favId)).thenReturn(Optional.of(f));

        assertThatThrownBy(() -> favoriteService.delete(favId, device))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("403");
    }

    @Test
    void delete_throws404_whenNotFound() {
        when(favoriteRepository.findById(favId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> favoriteService.delete(favId, device))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("404");
    }
}
