package be.younes.consentmail.controller;

import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.Map;

@RestController
public class SessionController {
    @GetMapping("/api/session")
    public Map<String, String> session(Principal user, CsrfToken csrf) {
        return Map.of(
                "username",
                user.getName(),
                "csrfHeader",
                csrf.getHeaderName(),
                "csrfToken",
                csrf.getToken());
    }
}
