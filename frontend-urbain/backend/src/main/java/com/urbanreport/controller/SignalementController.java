package com.urbanreport.controller;

import com.urbanreport.dto.SignalementDTO;
import com.urbanreport.service.SignalementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/signalements")
@RequiredArgsConstructor
public class SignalementController {

    private final SignalementService signalementService;

    @GetMapping("/public")
    public ResponseEntity<List<SignalementDTO>> getPublic() {
        return ResponseEntity.ok(signalementService.getAll());
    }

    @GetMapping
    public ResponseEntity<List<SignalementDTO>> getAll() {
        return ResponseEntity.ok(signalementService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SignalementDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(signalementService.getById(id));
    }

    @GetMapping("/mes-signalements")
    public ResponseEntity<List<SignalementDTO>> getMine(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(signalementService.getByUser(userDetails.getUsername()));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<SignalementDTO> create(
            @RequestParam String titre,
            @RequestParam String description,
            @RequestParam String categorie,
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam(required = false) String adresse,
            @RequestParam(required = false) MultipartFile photo,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                signalementService.create(titre, description, categorie,
                        latitude, longitude, adresse, photo,
                        userDetails.getUsername())
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        signalementService.delete(id);
        return ResponseEntity.noContent().build();
    }
}