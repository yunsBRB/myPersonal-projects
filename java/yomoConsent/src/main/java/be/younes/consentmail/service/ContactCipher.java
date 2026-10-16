package be.younes.consentmail.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;

import javax.crypto.Cipher;
import javax.crypto.Mac;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

@Component
public class ContactCipher {
    private final byte[] key;
    private final SecureRandom random = new SecureRandom();

    public ContactCipher(@Value("${app.encryption-key}") String base64Key) {
        key = Base64.getDecoder().decode(base64Key);
        if (key.length != 32)
            throw new IllegalArgumentException("A 32-byte encryption key is required.");
    }

    public String normalise(String email) {
        return email.strip().toLowerCase(Locale.ROOT);
    }

    public String fingerprint(String email) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key, "HmacSHA256"));
            return HexFormat.of()
                    .formatHex(
                            mac.doFinal(
                                    ("email:" + normalise(email))
                                            .getBytes(StandardCharsets.UTF_8)));
        } catch (java.security.GeneralSecurityException ex) {
            throw new IllegalStateException("Fingerprint operation failed.", ex);
        }
    }

    public String encrypt(String email) {
        try {
            byte[] nonce = new byte[12];
            random.nextBytes(nonce);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(
                    Cipher.ENCRYPT_MODE,
                    new SecretKeySpec(key, "AES"),
                    new GCMParameterSpec(128, nonce));
            byte[] encrypted = cipher.doFinal(normalise(email).getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder()
                    .encodeToString(
                            ByteBuffer.allocate(nonce.length + encrypted.length)
                                    .put(nonce)
                                    .put(encrypted)
                                    .array());
        } catch (java.security.GeneralSecurityException ex) {
            throw new IllegalStateException("Encryption failed.", ex);
        }
    }

    public String decrypt(String value) {
        try {
            ByteBuffer buffer = ByteBuffer.wrap(Base64.getDecoder().decode(value));
            byte[] nonce = new byte[12];
            buffer.get(nonce);
            byte[] encrypted = new byte[buffer.remaining()];
            buffer.get(encrypted);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(
                    Cipher.DECRYPT_MODE,
                    new SecretKeySpec(key, "AES"),
                    new GCMParameterSpec(128, nonce));
            return new String(cipher.doFinal(encrypted), StandardCharsets.UTF_8);
        } catch (java.security.GeneralSecurityException ex) {
            throw new IllegalStateException("Decryption failed.", ex);
        }
    }
}
