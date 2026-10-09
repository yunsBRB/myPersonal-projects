package be.younes.consentmail.dto;

import be.younes.consentmail.entity.Subscription;

import jakarta.validation.constraints.*;

import java.time.Instant;

public final class ConsentDtos {
    private ConsentDtos() {}

    public record Subscribe(
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Pattern(regexp = "[a-z][a-z0-9-]{0,79}") String purpose,
            @NotBlank @Size(max = 80) String noticeVersion,
            @NotBlank @Size(max = 160) String source) {}

    public record Tokens(
            Long subscriptionId, String confirmationToken, String withdrawalToken, String status) {}

    public record Token(@NotBlank @Size(min = 43, max = 43) String token) {}

    public record SubscriptionView(
            Long id,
            String purpose,
            String noticeVersion,
            String status,
            Instant confirmedAt,
            Instant withdrawnAt) {
        public static SubscriptionView of(Subscription s) {
            return new SubscriptionView(
                    s.getId(),
                    s.getPurpose(),
                    s.getNoticeVersion(),
                    s.getStatus(),
                    s.getConfirmedAt(),
                    s.getWithdrawnAt());
        }
    }

    public record NewCampaign(
            @NotBlank @Size(max = 160) String name,
            @NotBlank @Size(max = 200) String subject,
            @NotBlank @Pattern(regexp = "[a-z][a-z0-9-]{0,79}") String purpose) {}

    public record CampaignView(
            Long id, String name, String subject, String purpose, String status) {}

    public record Audience(Long campaignId, String purpose, long eligibleContacts, String mode) {}
}
