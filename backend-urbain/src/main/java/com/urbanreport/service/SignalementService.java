package com.urbanreport.service;

import com.urbanreport.dto.SignalementDTO;
import com.urbanreport.entity.*;
import com.urbanreport.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.file.*;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SignalementService {

    private final SignalementRepository  signalementRepository;
    private final UserRepository         userRepository;
    private final InterventionRepository interventionRepository;

    private final String uploadDir = System.getProperty("user.dir")
            + File.separator + "uploads" + File.separator;

    // ── Helper: build DTO avec photoApresUrl ──────────
    private SignalementDTO buildDTO(Signalement s) {
        try {
            List<Intervention> interventions = interventionRepository.findBySignalementOrderByCreatedAtDesc(s);
            for (Intervention interv : interventions) {
                if (interv.getPhotoApresUrl() != null) {
                    return SignalementDTO.fromEntity(s, interv.getPhotoApresUrl(), interv.getCommentaire());
                }
            }
        } catch (Exception e) {
            // continuer sans photo
        }
        return SignalementDTO.fromEntity(s);
    }
    // ─────────────────────────────────────────────────

    public List<SignalementDTO> getAll() {
        return signalementRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::buildDTO)
                .collect(Collectors.toList());
    }

    public SignalementDTO getById(Long id) {
        Signalement s = signalementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Non trouvé"));
        return buildDTO(s);
    }

    public List<SignalementDTO> getByUser(String email) {
        User user = userRepository.findByEmail(email).orElseThrow();
        return signalementRepository.findByUserOrderByCreatedAtDesc(user)
                .stream().map(this::buildDTO)
                .collect(Collectors.toList());
    }

    public SignalementDTO create(String titre, String description,
                                 String categorie, Double lat, Double lng,
                                 String adresse, MultipartFile photo,
                                 String email) {
        User user = userRepository.findByEmail(email).orElseThrow();
        String photoUrl = null;

        if (photo != null && !photo.isEmpty()) {
            try {
                Path uploadPath = Paths.get(uploadDir);
                if (!Files.exists(uploadPath)) Files.createDirectories(uploadPath);
                String originalName = photo.getOriginalFilename();
                String extension = (originalName != null && originalName.contains("."))
                        ? originalName.substring(originalName.lastIndexOf(".")) : ".jpg";
                String filename = UUID.randomUUID() + extension;
                Files.write(uploadPath.resolve(filename), photo.getBytes());
                photoUrl = "/uploads/" + filename;
            } catch (IOException e) {
                System.out.println(">>> Photo error: " + e.getMessage());
            }
        }

        Signalement s = Signalement.builder()
                .titre(titre).description(description)
                .categorie(Signalement.Categorie.valueOf(categorie))
                .latitude(lat).longitude(lng)
                .adresse(adresse).photoUrl(photoUrl).user(user)
                .build();

        return SignalementDTO.fromEntity(signalementRepository.save(s));
    }

    public void delete(Long id) {
        signalementRepository.deleteById(id);
    }
}