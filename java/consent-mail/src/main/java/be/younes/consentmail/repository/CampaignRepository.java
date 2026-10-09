package be.younes.consentmail.repository;

import be.younes.consentmail.entity.Campaign;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CampaignRepository extends JpaRepository<Campaign, Long> {}
