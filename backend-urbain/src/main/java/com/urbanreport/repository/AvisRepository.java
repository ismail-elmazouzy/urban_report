package com.urbanreport.repository;

import com.urbanreport.entity.Avis;
import com.urbanreport.entity.Signalement;
import com.urbanreport.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AvisRepository extends JpaRepository<Avis, Long> {
    List<Avis> findBySignalementOrderByCreatedAtDesc(Signalement signalement);
    boolean existsByUserAndSignalement(User user, Signalement signalement);
    long countBySignalement(Signalement signalement);
    List<Avis> findBySignalement(Signalement signalement);
}