package be.younes.consentmail.repository;

import be.younes.consentmail.entity.Subscription;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    Optional<Subscription> findByConfirmationHash(String hash);

    Optional<Subscription> findByWithdrawalHash(String hash);

    boolean existsByEmailHashAndPurpose(String emailHash, String purpose);

    long countByPurposeAndStatus(String purpose, String status);
}
