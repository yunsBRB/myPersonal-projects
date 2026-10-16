package be.younes.consentmail.config;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

@SpringBootTest
@ActiveProfiles("demo")
class AuthenticationTest {
    @Autowired WebApplicationContext context;
    MockMvc mvc;

    @BeforeEach
    void setup() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    @Test
    void authenticatesConfiguredPasswordsAndProvidesCsrfToken() throws Exception {
        mvc.perform(get("/api/session").with(httpBasic("operator", "operator-local")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("operator"))
                .andExpect(jsonPath("$.csrfToken").isNotEmpty());
    }

    @Test
    void rejectsIncorrectPasswords() throws Exception {
        mvc.perform(
                        get("/api/session")
                                .accept("application/json")
                                .with(httpBasic("operator", "incorrect")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void requiresCsrfOnMutations() throws Exception {
        mvc.perform(post("/api/protected-operation").with(httpBasic("operator", "operator-local")))
                .andExpect(status().isForbidden());
    }
}
