package com.urbanreport.controller;

import com.urbanreport.dto.SignalementDTO;
import com.urbanreport.entity.*;
import com.urbanreport.repository.*;
import com.urbanreport.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final SignalementRepository signalementRepository;
    private final UserRepository userRepository;
    private final UserService userService;

    private static final String SUPER_ADMIN_EMAIL = "admin2@urbanreport.ma";

    // ── Signalements ──────────────────────────────────────
    @GetMapping("/signalements")
    public ResponseEntity<List<SignalementDTO>> getAll() {
        List<SignalementDTO> list = signalementRepository
                .findAllByOrderByCreatedAtDesc()
                .stream()
                .map(SignalementDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @PutMapping("/signalements/{id}/statut")
    public ResponseEntity<SignalementDTO> updateStatut(
            @PathVariable Long id,
            @RequestParam String statut) {
        Signalement s = signalementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Non trouvé"));
        s.setStatut(Signalement.Statut.valueOf(statut));
        return ResponseEntity.ok(SignalementDTO.fromEntity(signalementRepository.save(s)));
    }

    @DeleteMapping("/signalements/{id}")
    public ResponseEntity<Void> deleteSignalement(@PathVariable Long id) {
        signalementRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/signalements/filtre")
    public ResponseEntity<List<SignalementDTO>> filtrer(
            @RequestParam(required = false) String statut,
            @RequestParam(required = false) String categorie) {
        List<Signalement> result;
        if (statut != null)
            result = signalementRepository.findByStatut(Signalement.Statut.valueOf(statut));
        else if (categorie != null)
            result = signalementRepository.findByCategorie(Signalement.Categorie.valueOf(categorie));
        else
            result = signalementRepository.findAllByOrderByCreatedAtDesc();

        return ResponseEntity.ok(result.stream()
                .map(SignalementDTO::fromEntity)
                .collect(Collectors.toList()));
    }

    // ── Utilisateurs ──────────────────────────────────────
    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<?> updateRole(
            @PathVariable Long id,
            @RequestParam String role,
            @AuthenticationPrincipal UserDetails currentUser) {

        User targetUser = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        // لا يمكن تغيير دور Super Admin
        if (targetUser.getEmail().equals(SUPER_ADMIN_EMAIL)) {
            return ResponseEntity.status(403)
                    .body("Impossible de modifier le rôle du Super Admin");
        }

        // Admin عادي لا يمكنه تغيير admin آخر
        if (targetUser.getRole() == User.Role.ADMIN
                && !currentUser.getUsername().equals(SUPER_ADMIN_EMAIL)) {
            return ResponseEntity.status(403)
                    .body("Seul le Super Admin peut modifier un autre Admin");
        }

        targetUser.setRole(User.Role.valueOf(role));
        return ResponseEntity.ok(userRepository.save(targetUser));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails currentUser) {

        User targetUser = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        // لا يمكن حذف Super Admin
        if (targetUser.getEmail().equals(SUPER_ADMIN_EMAIL)) {
            return ResponseEntity.status(403)
                    .body("Impossible de supprimer le Super Admin");
        }

        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    // ── Statistiques ──────────────────────────────────────
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        long total   = signalementRepository.count();
        long signale = signalementRepository.findByStatut(Signalement.Statut.SIGNALE).size();
        long enCours = signalementRepository.findByStatut(Signalement.Statut.EN_COURS).size();
        long resolu  = signalementRepository.findByStatut(Signalement.Statut.RESOLU).size();
        long users   = userRepository.count();

        return ResponseEntity.ok(Map.of(
                "total",      total,
                "signale",    signale,
                "enCours",    enCours,
                "resolu",     resolu,
                "totalUsers", users
        ));
    }
}