package be.younes.consentmail.entity;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
public class ConsentEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long subscriptionId;

    @Column(nullable = false)
    private String action;

    @Column(nullable = false)
    private String actor;

    @Column(nullable = false)
    private Instant occurredAt;

    protected ConsentEvent() {}

    public ConsentEvent(Long subscriptionId, String action, String actor, Instant occurredAt) {
        this.subscriptionId = subscriptionId;
        this.action = action;
        this.actor = actor;
        this.occurredAt = occurredAt;
    }

    public Long getId() {
        return id;
    }

    public Long getSubscriptionId() {
        return subscriptionId;
    }

    public String getAction() {
        return action;
    }

    public String getActor() {
        return actor;
    }

    public Instant getOccurredAt() {
        return occurredAt;
    }
}
