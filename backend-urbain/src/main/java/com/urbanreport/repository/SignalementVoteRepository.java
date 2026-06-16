package com.urbanreport.repository;

import com.urbanreport.entity.Signalement;
import com.urbanreport.entity.SignalementVote;
import com.urbanreport.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SignalementVoteRepository extends JpaRepository<SignalementVote, Long> {
    long countBySignalement(Signalement signalement);
    boolean existsByUserAndSignalement(User user, Signalement signalement);
    List<SignalementVote> findByUser(User user);
    List<SignalementVote> findBySignalement(Signalement signalement);
}