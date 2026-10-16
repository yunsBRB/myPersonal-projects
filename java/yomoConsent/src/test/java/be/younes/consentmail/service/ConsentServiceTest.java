package be.younes.consentmail.service;

import static org.junit.jupiter.api.Assertions.*;

import be.younes.consentmail.dto.ConsentDtos.*;
import be.younes.consentmail.entity.Subscription;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@SpringBootTest
@ActiveProfiles("demo")
@Transactional
class ConsentServiceTest {
    @Autowired ConsentService service;
    @Autowired ContactCipher cipher;

    private Tokens subscribe(String email, String purpose) {
        return service.subscribe(
                new Subscribe(email, purpose, "notice-v1", "demo-form"), "operator");
    }

    @Test
    void audienceRequiresConfirmationForTheMatchingPurposeAndHonoursWithdrawal() {
        var t = subscribe("demo@example.com", "newsletter");
        var c = service.campaign(new NewCampaign("Monthly news", "September update", "newsletter"));
        assertEquals(0, service.audience(c.id()).eligibleContacts());
        service.confirm(t.confirmationToken(), "operator");
        assertEquals(1, service.audience(c.id()).eligibleContacts());
        var other = service.campaign(new NewCampaign("Offers", "An offer", "offers"));
        assertEquals(0, service.audience(other.id()).eligibleContacts());
        service.withdraw(t.withdrawalToken(), "operator");
        assertEquals(0, service.audience(c.id()).eligibleContacts());
    }

    @Test
    void confirmationCannotBeReplayed() {
        var t = subscribe("demo@example.com", "newsletter");
        service.confirm(t.confirmationToken(), "operator");
        assertThrows(
                IllegalArgumentException.class,
                () -> service.confirm(t.confirmationToken(), "operator"));
    }

    @Test
    void withdrawalIsIdempotentAndPreventsLateConfirmation() {
        var t = subscribe("demo@example.com", "newsletter");
        service.withdraw(t.withdrawalToken(), "operator");
        assertEquals("WITHDRAWN", service.withdraw(t.withdrawalToken(), "operator").status());
        assertThrows(
                IllegalArgumentException.class,
                () -> service.confirm(t.confirmationToken(), "operator"));
    }

    @Test
    void duplicateEmailIsNormalisedWithinPurpose() {
        subscribe("Demo@example.com", "newsletter");
        assertThrows(
                IllegalStateException.class, () -> subscribe("demo@example.com", "newsletter"));
        assertDoesNotThrow(() -> subscribe("demo@example.com", "offers"));
    }

    @Test
    void tokenExpiresExactlyAfterOneDay() {
        Instant now = Instant.parse("2026-09-27T10:00:00Z");
        var sub =
                new Subscription(
                        "encrypted", "hash", "news", "v1", "demo", now, "token", "withdrawal");
        assertThrows(IllegalStateException.class, () -> sub.confirm(now.plusSeconds(86400)));
    }

    @Test
    void encryptionUsesDifferentNoncesAndRoundTrips() {
        String first = cipher.encrypt("Demo@example.com"),
                second = cipher.encrypt("Demo@example.com");
        assertNotEquals(first, second);
        assertFalse(first.contains("example.com"));
        assertEquals("demo@example.com", cipher.decrypt(first));
    }
}
