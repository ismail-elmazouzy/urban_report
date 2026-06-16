package com.urbanreport.controller;

import com.urbanreport.entity.*;
import com.urbanreport.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/signalements")
@RequiredArgsConstructor
public class AvisController {

    private final AvisRepository       avisRepository;
    private final SignalementRepository signalementRepository;
    private final UserRepository        userRepository;

    // ── POST /api/signalements/{id}/avis ─────────────────
    @PostMapping("/{id}/avis")
    public ResponseEntity<?> addAvis(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails userDetails) {

        Signalement signalement = signalementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Signalement non trouvé"));

        // Vérifier que le signalement est RESOLU
        if (signalement.getStatut() != Signalement.Statut.RESOLU) {
            return ResponseEntity.status(400)
                    .body(Map.of("message", "Vous ne pouvez laisser un avis que sur un signalement résolu."));
        }

        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();

        // Vérifier qu'il n'a pas déjà donné un avis
        if (avisRepository.existsByUserAndSignalement(user, signalement)) {
            return ResponseEntity.status(409)
                    .body(Map.of("message", "Vous avez déjà laissé un avis sur ce signalement."));
        }

        // Valider la note
        int note;
        try {
            note = Integer.parseInt(body.get("note").toString());
            if (note < 1 || note > 5) throw new NumberFormatException();
        } catch (Exception e) {
            return ResponseEntity.status(400)
                    .body(Map.of("message", "La note doit être entre 1 et 5."));
        }

        String commentaire = body.get("commentaire") != null
                ? body.get("commentaire").toString().trim() : null;

        Avis avis = Avis.builder()
                .user(user)
                .signalement(signalement)
                .note(note)
                .commentaire(commentaire.isEmpty() ? null : commentaire)
                .build();

        avisRepository.save(avis);

        return ResponseEntity.ok(Map.of(
                "message", "Avis enregistré avec succès",
                "note", note,
                "commentaire", commentaire != null ? commentaire : ""
        ));
    }

    // ── GET /api/signalements/{id}/avis ──────────────────
    @GetMapping("/{id}/avis")
    public ResponseEntity<?> getAvis(@PathVariable Long id) {

        Signalement signalement = signalementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Signalement non trouvé"));

        List<Avis> avisList = avisRepository.findBySignalementOrderByCreatedAtDesc(signalement);

        double moyenne = avisList.stream()
                .mapToInt(Avis::getNote)
                .average()
                .orElse(0.0);

        List<Map<String, Object>> result = avisList.stream().map(a -> Map.<String, Object>of(
                "id",          a.getId(),
                "note",        a.getNote(),
                "commentaire", a.getCommentaire() != null ? a.getCommentaire() : "",
                "userNom",     a.getUser().getNom() + " " + a.getUser().getPrenom(),
                "createdAt",   a.getCreatedAt().toString()
        )).collect(Collectors.toList());

        return ResponseEntity.ok(Map.of(
                "avis",    result,
                "total",   avisList.size(),
                "moyenne", Math.round(moyenne * 10.0) / 10.0
        ));
    }

    // ── GET /api/signalements/{id}/avis/moi ──────────────
    // واش المستخدم الحالي دار avis ولا لا
    @GetMapping("/{id}/avis/moi")
    public ResponseEntity<?> monAvis(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        Signalement signalement = signalementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Non trouvé"));

        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();

        boolean dejaAvis = avisRepository.existsByUserAndSignalement(user, signalement);

        return ResponseEntity.ok(Map.of("dejaAvis", dejaAvis));
    }
}