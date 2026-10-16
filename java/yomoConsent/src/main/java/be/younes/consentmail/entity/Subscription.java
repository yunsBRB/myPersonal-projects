package be.younes.consentmail.entity;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"email_hash", "purpose"}))
public class Subscription {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version private long version;

    @Column(nullable = false, length = 1000)
    private String encryptedEmail;

    @Column(nullable = false, length = 64)
    private String emailHash;

    @Column(nullable = false, length = 80)
    private String purpose;

    @Column(nullable = false, length = 80)
    private String noticeVersion;

    @Column(nullable = false, length = 160)
    private String source;

    @Column(nullable = false)
    private Instant requestedAt;

    @Column(nullable = false)
    private Instant tokenExpiresAt;

    @Column(unique = true, length = 64)
    private String confirmationHash;

    @Column(nullable = false, unique = true, length = 64)
    private String withdrawalHash;

    @Column(nullable = false)
    private String status;

    private Instant confirmedAt;
    private Instant withdrawnAt;

    protected Subscription() {}

    public Subscription(
            String encryptedEmail,
            String emailHash,
            String purpose,
            String noticeVersion,
            String source,
            Instant at,
            String confirmationHash,
            String withdrawalHash) {
        this.encryptedEmail = encryptedEmail;
        this.emailHash = emailHash;
        this.purpose = purpose;
        this.noticeVersion = noticeVersion;
        this.source = source;
        this.requestedAt = at;
        this.tokenExpiresAt = at.plusSeconds(86400);
        this.confirmationHash = confirmationHash;
        this.withdrawalHash = withdrawalHash;
        this.status = "PENDING";
    }

    public void confirm(Instant now) {
        if (!"PENDING".equals(status) || !now.isBefore(tokenExpiresAt))
            throw new IllegalStateException("Confirmation is unavailable or expired.");
        status = "CONFIRMED";
        confirmedAt = now;
        confirmationHash = null;
    }

    public boolean withdraw(Instant now) {
        if ("WITHDRAWN".equals(status)) return false;
        status = "WITHDRAWN";
        withdrawnAt = now;
        confirmationHash = null;
        return true;
    }

    public Long getId() {
        return id;
    }

    public String getStatus() {
        return status;
    }

    public String getPurpose() {
        return purpose;
    }

    public String getNoticeVersion() {
        return noticeVersion;
    }

    public Instant getConfirmedAt() {
        return confirmedAt;
    }

    public Instant getWithdrawnAt() {
        return withdrawnAt;
    }
}
