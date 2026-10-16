package be.younes.consentmail.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

import java.time.Clock;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {
    @Bean
    Clock clock() {
        return Clock.systemUTC();
    }

    @Bean
    UserDetailsService users(
            @Value("${app.operator-password}") String operator,
            @Value("${app.reviewer-password}") String reviewer,
            @Value("${app.admin-password}") String admin) {
        var encoder = PasswordEncoderFactories.createDelegatingPasswordEncoder();
        return new InMemoryUserDetailsManager(
                User.withUsername("operator")
                        .password(encoder.encode(operator))
                        .roles("OPERATOR")
                        .build(),
                User.withUsername("reviewer")
                        .password(encoder.encode(reviewer))
                        .roles("REVIEWER")
                        .build(),
                User.withUsername("admin").password(encoder.encode(admin)).roles("ADMIN").build());
    }

    @Bean
    SecurityFilterChain security(HttpSecurity http) throws Exception {
        return http.authorizeHttpRequests(
                        auth ->
                                auth.requestMatchers("/style.css", "/error")
                                        .permitAll()
                                        .anyRequest()
                                        .authenticated())
                .formLogin(Customizer.withDefaults())
                .httpBasic(Customizer.withDefaults())
                .build();
    }
}
