package com.urbanreport.repository;

import com.urbanreport.entity.Intervention;
import com.urbanreport.entity.Signalement;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface InterventionRepository extends JpaRepository<Intervention, Long> {
    List<Intervention> findBySignalementOrderByCreatedAtDesc(Signalement signalement);


}