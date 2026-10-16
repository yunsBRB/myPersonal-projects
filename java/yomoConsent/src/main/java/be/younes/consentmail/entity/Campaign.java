package be.younes.consentmail.entity;

import jakarta.persistence.*;

@Entity
public class Campaign {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 160)
    private String name;

    @Column(nullable = false, length = 200)
    private String subject;

    @Column(nullable = false, length = 80)
    private String purpose;

    protected Campaign() {}

    public Campaign(String name, String subject, String purpose) {
        this.name = name;
        this.subject = subject;
        this.purpose = purpose;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getSubject() {
        return subject;
    }

    public String getPurpose() {
        return purpose;
    }
}
