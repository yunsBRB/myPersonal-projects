package be.younes.consentmail.service;

import be.younes.consentmail.dto.ConsentDtos.*;
import be.younes.consentmail.entity.*;
import be.younes.consentmail.repository.*;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.util.List;

@Service
@Transactional
public class ConsentService {
    private final SubscriptionRepository subscriptions;
    private final ConsentEventRepository events;
    private final CampaignRepository campaigns;
    private final ContactCipher cipher;
    private final Clock clock;

    public ConsentService(
            SubscriptionRepository subscriptions,
            ConsentEventRepository events,
            CampaignRepository campaigns,
            ContactCipher cipher,
            Clock clock) {
        this.subscriptions = subscriptions;
        this.events = events;
        this.campaigns = campaigns;
        this.cipher = cipher;
        this.clock = clock;
    }

    public Tokens subscribe(Subscribe request, String actor) {
        String hash = cipher.fingerprint(request.email());
        if (subscriptions.existsByEmailHashAndPurpose(hash, request.purpose()))
            throw new IllegalStateException(
                    "A subscription already exists for this address and purpose.");
        String confirmation = ConsentTokens.generate(), withdrawal = ConsentTokens.generate();
        var sub =
                subscriptions.save(
                        new Subscription(
                                cipher.encrypt(request.email()),
                                hash,
                                request.purpose(),
                                request.noticeVersion(),
                                request.source(),
                                clock.instant(),
                                ConsentTokens.hash(confirmation),
                                ConsentTokens.hash(withdrawal)));
        record(sub.getId(), "REQUESTED", actor);
        return new Tokens(sub.getId(), confirmation, withdrawal, sub.getStatus());
    }

    public SubscriptionView confirm(String token, String actor) {
        var sub =
                subscriptions
                        .findByConfirmationHash(ConsentTokens.hash(token))
                        .orElseThrow(
                                () ->
                                        new IllegalArgumentException(
                                                "Confirmation token is invalid or already used."));
        sub.confirm(clock.instant());
        subscriptions.flush();
        record(sub.getId(), "CONFIRMED", actor);
        return SubscriptionView.of(sub);
    }

    public SubscriptionView withdraw(String token, String actor) {
        var sub =
                subscriptions
                        .findByWithdrawalHash(ConsentTokens.hash(token))
                        .orElseThrow(
                                () -> new IllegalArgumentException("Withdrawal token is invalid."));
        if (sub.withdraw(clock.instant())) {
            subscriptions.flush();
            record(sub.getId(), "WITHDRAWN", actor);
        }
        return SubscriptionView.of(sub);
    }

    @Transactional(readOnly = true)
    public List<SubscriptionView> list(int page) {
        return subscriptions
                .findAll(PageRequest.of(Math.max(page, 0), 50))
                .map(SubscriptionView::of)
                .getContent();
    }

    public CampaignView campaign(NewCampaign request) {
        var c =
                campaigns.save(
                        new Campaign(
                                request.name().strip(),
                                request.subject().strip(),
                                request.purpose()));
        return new CampaignView(c.getId(), c.getName(), c.getSubject(), c.getPurpose(), "DRAFT");
    }

    @Transactional(readOnly = true)
    public Audience audience(Long id) {
        var campaign =
                campaigns
                        .findById(id)
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Campaign not found."));
        return new Audience(
                id,
                campaign.getPurpose(),
                subscriptions.countByPurposeAndStatus(campaign.getPurpose(), "CONFIRMED"),
                "PREVIEW_ONLY");
    }

    private void record(Long id, String action, String actor) {
        events.save(new ConsentEvent(id, action, actor, clock.instant()));
    }
}
