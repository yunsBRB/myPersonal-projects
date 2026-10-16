package be.younes.consentmail.controller;

import be.younes.consentmail.dto.ConsentDtos.*;
import be.younes.consentmail.repository.ConsentEventRepository;
import be.younes.consentmail.service.ConsentService;

import jakarta.validation.Valid;

import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api")
@PreAuthorize("hasAnyRole('OPERATOR','ADMIN')")
public class ConsentController {
    private final ConsentService service;
    private final ConsentEventRepository events;

    public ConsentController(ConsentService service, ConsentEventRepository events) {
        this.service = service;
        this.events = events;
    }

    @PostMapping("/subscriptions")
    public Tokens subscribe(@Valid @RequestBody Subscribe request, Principal user) {
        return service.subscribe(request, user.getName());
    }

    @GetMapping("/subscriptions")
    public List<SubscriptionView> list(@RequestParam(defaultValue = "0") int page) {
        return service.list(page);
    }

    @PostMapping("/consents/confirm")
    public SubscriptionView confirm(@Valid @RequestBody Token request, Principal user) {
        return service.confirm(request.token(), user.getName());
    }

    @PostMapping("/consents/withdraw")
    public SubscriptionView withdraw(@Valid @RequestBody Token request, Principal user) {
        return service.withdraw(request.token(), user.getName());
    }

    @PostMapping("/campaigns")
    public CampaignView campaign(@Valid @RequestBody NewCampaign request) {
        return service.campaign(request);
    }

    @GetMapping("/campaigns/{id}/audience")
    public Audience audience(@PathVariable Long id) {
        return service.audience(id);
    }

    public record EventView(
            Long id, Long subscriptionId, String action, String actor, Instant occurredAt) {}

    @GetMapping("/consent-events")
    @PreAuthorize("hasRole('ADMIN')")
    public List<EventView> events(@RequestParam(defaultValue = "0") int page) {
        return events.findAll(PageRequest.of(Math.max(page, 0), 50))
                .map(
                        e ->
                                new EventView(
                                        e.getId(),
                                        e.getSubscriptionId(),
                                        e.getAction(),
                                        e.getActor(),
                                        e.getOccurredAt()))
                .getContent();
    }
}
