package be.younes.consentmail.repository;

import be.younes.consentmail.entity.ConsentEvent;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ConsentEventRepository extends JpaRepository<ConsentEvent, Long> {}
