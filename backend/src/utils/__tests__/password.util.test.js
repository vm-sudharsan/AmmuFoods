const bcrypt = require("bcryptjs");
const { hashPassword, comparePassword } = require("../password.util");

describe("Password Utility Functions", () => {
  describe("hashPassword", () => {
    it("should hash a valid password", async () => {
      const password = "mySecurePassword123";

      const hashedPassword = await hashPassword(password);

      expect(hashedPassword).toBeDefined();
      expect(typeof hashedPassword).toBe("string");
      expect(hashedPassword).not.toBe(password); // Should not be plaintext
    });

    it("should generate a bcrypt hash with correct format", async () => {
      const password = "testPassword";

      const hashedPassword = await hashPassword(password);

      // Bcrypt hashes start with $2a$, $2b$, or $2y$ followed by cost factor
      expect(hashedPassword).toMatch(/^\$2[aby]\$\d{2}\$/);
    });

    it("should use 10 salt rounds", async () => {
      const password = "testPassword";

      const hashedPassword = await hashPassword(password);

      // Extract cost factor from hash (characters 4-5)
      const costFactor = hashedPassword.substring(4, 6);
      expect(costFactor).toBe("10");
    });

    it("should generate different hashes for the same password", async () => {
      const password = "samePassword";

      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      // Due to different salts, hashes should be different
      expect(hash1).not.toBe(hash2);
    });

    it("should generate different hashes for different passwords", async () => {
      const password1 = "password1";
      const password2 = "password2";

      const hash1 = await hashPassword(password1);
      const hash2 = await hashPassword(password2);

      expect(hash1).not.toBe(hash2);
    });

    it("should throw error for empty password", async () => {
      await expect(hashPassword("")).rejects.toThrow(
        "Password must be a non-empty string"
      );
    });

    it("should throw error for null password", async () => {
      await expect(hashPassword(null)).rejects.toThrow(
        "Password must be a non-empty string"
      );
    });

    it("should throw error for undefined password", async () => {
      await expect(hashPassword(undefined)).rejects.toThrow(
        "Password must be a non-empty string"
      );
    });

    it("should throw error for non-string password", async () => {
      await expect(hashPassword(12345)).rejects.toThrow(
        "Password must be a non-empty string"
      );
    });

    it("should handle very long passwords", async () => {
      const longPassword = "a".repeat(1000);

      const hashedPassword = await hashPassword(longPassword);

      expect(hashedPassword).toBeDefined();
      expect(typeof hashedPassword).toBe("string");
    });

    it("should handle passwords with special characters", async () => {
      const specialPassword = "P@ssw0rd!#$%^&*()_+-=[]{}|;:',.<>?/~`";

      const hashedPassword = await hashPassword(specialPassword);

      expect(hashedPassword).toBeDefined();
      expect(typeof hashedPassword).toBe("string");
    });

    it("should handle passwords with unicode characters", async () => {
      const unicodePassword = "パスワード123";

      const hashedPassword = await hashPassword(unicodePassword);

      expect(hashedPassword).toBeDefined();
      expect(typeof hashedPassword).toBe("string");
    });

    it("should handle passwords with spaces", async () => {
      const passwordWithSpaces = "my secure password 123";

      const hashedPassword = await hashPassword(passwordWithSpaces);

      expect(hashedPassword).toBeDefined();
      expect(typeof hashedPassword).toBe("string");
    });

    it("should produce hash that can be verified by bcrypt", async () => {
      const password = "verifyMe123";

      const hashedPassword = await hashPassword(password);
      const isValid = await bcrypt.compare(password, hashedPassword);

      expect(isValid).toBe(true);
    });
  });

  describe("comparePassword", () => {
    it("should return true for matching password and hash", async () => {
      const password = "correctPassword123";
      const hashedPassword = await hashPassword(password);

      const isMatch = await comparePassword(password, hashedPassword);

      expect(isMatch).toBe(true);
    });

    it("should return false for non-matching password and hash", async () => {
      const password = "correctPassword123";
      const wrongPassword = "wrongPassword456";
      const hashedPassword = await hashPassword(password);

      const isMatch = await comparePassword(wrongPassword, hashedPassword);

      expect(isMatch).toBe(false);
    });

    it("should return false for empty password against valid hash", async () => {
      const password = "correctPassword123";
      const hashedPassword = await hashPassword(password);

      await expect(comparePassword("", hashedPassword)).rejects.toThrow(
        "Password must be a non-empty string"
      );
    });

    it("should throw error for null password", async () => {
      const hashedPassword = await hashPassword("testPassword");

      await expect(comparePassword(null, hashedPassword)).rejects.toThrow(
        "Password must be a non-empty string"
      );
    });

    it("should throw error for undefined password", async () => {
      const hashedPassword = await hashPassword("testPassword");

      await expect(comparePassword(undefined, hashedPassword)).rejects.toThrow(
        "Password must be a non-empty string"
      );
    });

    it("should throw error for empty hashed password", async () => {
      const password = "testPassword";

      await expect(comparePassword(password, "")).rejects.toThrow(
        "Hashed password must be a non-empty string"
      );
    });

    it("should throw error for null hashed password", async () => {
      const password = "testPassword";

      await expect(comparePassword(password, null)).rejects.toThrow(
        "Hashed password must be a non-empty string"
      );
    });

    it("should throw error for undefined hashed password", async () => {
      const password = "testPassword";

      await expect(comparePassword(password, undefined)).rejects.toThrow(
        "Hashed password must be a non-empty string"
      );
    });

    it("should handle case-sensitive password comparison", async () => {
      const password = "CaseSensitive123";
      const hashedPassword = await hashPassword(password);

      const isMatchCorrect = await comparePassword(password, hashedPassword);
      const isMatchWrong = await comparePassword(
        "casesensitive123",
        hashedPassword
      );

      expect(isMatchCorrect).toBe(true);
      expect(isMatchWrong).toBe(false);
    });

    it("should handle passwords with special characters", async () => {
      const password = "P@ssw0rd!#$%";
      const hashedPassword = await hashPassword(password);

      const isMatch = await comparePassword(password, hashedPassword);

      expect(isMatch).toBe(true);
    });

    it("should handle passwords with unicode characters", async () => {
      const password = "パスワード123";
      const hashedPassword = await hashPassword(password);

      const isMatch = await comparePassword(password, hashedPassword);

      expect(isMatch).toBe(true);
    });

    it("should handle very long passwords", async () => {
      const longPassword = "a".repeat(1000);
      const hashedPassword = await hashPassword(longPassword);

      const isMatch = await comparePassword(longPassword, hashedPassword);

      expect(isMatch).toBe(true);
    });

    it("should return false for slightly different passwords", async () => {
      const password = "password123";
      const hashedPassword = await hashPassword(password);
      const slightlyDifferent = "password124"; // Last character different

      const isMatch = await comparePassword(slightlyDifferent, hashedPassword);

      expect(isMatch).toBe(false);
    });

    it("should return false for password with extra character", async () => {
      const password = "password";
      const hashedPassword = await hashPassword(password);
      const withExtra = "password1";

      const isMatch = await comparePassword(withExtra, hashedPassword);

      expect(isMatch).toBe(false);
    });

    it("should return false for password missing a character", async () => {
      const password = "password123";
      const hashedPassword = await hashPassword(password);
      const withMissing = "password12";

      const isMatch = await comparePassword(withMissing, hashedPassword);

      expect(isMatch).toBe(false);
    });

    it("should handle passwords with spaces correctly", async () => {
      const password = "my secure password";
      const hashedPassword = await hashPassword(password);

      const isMatchCorrect = await comparePassword(password, hashedPassword);
      const isMatchWrong = await comparePassword(
        "mysecurepassword",
        hashedPassword
      );

      expect(isMatchCorrect).toBe(true);
      expect(isMatchWrong).toBe(false);
    });
  });

  describe("Password hashing and comparison integration", () => {
    it("should complete full hash and compare cycle", async () => {
      const password = "integrationTest123";

      // Hash the password
      const hashedPassword = await hashPassword(password);
      expect(hashedPassword).toBeDefined();

      // Compare correct password
      const isCorrect = await comparePassword(password, hashedPassword);
      expect(isCorrect).toBe(true);

      // Compare incorrect password
      const isIncorrect = await comparePassword(
        "wrongPassword",
        hashedPassword
      );
      expect(isIncorrect).toBe(false);
    });

    it("should handle multiple users with same password", async () => {
      const password = "commonPassword123";

      // Hash for user 1
      const hash1 = await hashPassword(password);
      // Hash for user 2
      const hash2 = await hashPassword(password);

      // Hashes should be different (different salts)
      expect(hash1).not.toBe(hash2);

      // But both should verify correctly
      const isValid1 = await comparePassword(password, hash1);
      const isValid2 = await comparePassword(password, hash2);

      expect(isValid1).toBe(true);
      expect(isValid2).toBe(true);
    });

    it("should not allow cross-verification of different passwords", async () => {
      const password1 = "userOnePassword";
      const password2 = "userTwoPassword";

      const hash1 = await hashPassword(password1);
      const hash2 = await hashPassword(password2);

      // Password 1 should not match hash 2
      const crossMatch1 = await comparePassword(password1, hash2);
      expect(crossMatch1).toBe(false);

      // Password 2 should not match hash 1
      const crossMatch2 = await comparePassword(password2, hash1);
      expect(crossMatch2).toBe(false);
    });

    it("should maintain security with multiple hash operations", async () => {
      const password = "securePassword123";

      // Hash the same password multiple times
      const hashes = await Promise.all([
        hashPassword(password),
        hashPassword(password),
        hashPassword(password),
      ]);

      // All hashes should be different
      expect(hashes[0]).not.toBe(hashes[1]);
      expect(hashes[1]).not.toBe(hashes[2]);
      expect(hashes[0]).not.toBe(hashes[2]);

      // But all should verify correctly
      const verifications = await Promise.all(
        hashes.map((hash) => comparePassword(password, hash))
      );

      expect(verifications).toEqual([true, true, true]);
    });
  });

  describe("Edge cases and security", () => {
    it("should not store plaintext password", async () => {
      const password = "plainTextPassword";

      const hashedPassword = await hashPassword(password);

      expect(hashedPassword).not.toContain(password);
      expect(hashedPassword.includes(password)).toBe(false);
    });

    it("should produce hash of consistent length", async () => {
      const shortPassword = "abc";
      const longPassword = "a".repeat(100);

      const shortHash = await hashPassword(shortPassword);
      const longHash = await hashPassword(longPassword);

      // Bcrypt hashes are always 60 characters
      expect(shortHash.length).toBe(60);
      expect(longHash.length).toBe(60);
    });

    it("should handle concurrent hashing operations", async () => {
      const passwords = [
        "password1",
        "password2",
        "password3",
        "password4",
        "password5",
      ];

      const hashes = await Promise.all(passwords.map(hashPassword));

      // All hashes should be unique
      const uniqueHashes = new Set(hashes);
      expect(uniqueHashes.size).toBe(passwords.length);

      // All should verify correctly
      const verifications = await Promise.all(
        passwords.map((pwd, idx) => comparePassword(pwd, hashes[idx]))
      );

      expect(verifications).toEqual([true, true, true, true, true]);
    });

    it("should handle minimum length password", async () => {
      const minPassword = "a"; // Single character

      const hashedPassword = await hashPassword(minPassword);
      const isMatch = await comparePassword(minPassword, hashedPassword);

      expect(isMatch).toBe(true);
    });

    it("should reject invalid bcrypt hash format", async () => {
      const password = "testPassword";
      const invalidHash = "not_a_valid_bcrypt_hash";

      // bcrypt.compare will throw or return false for invalid hash
      await expect(
        comparePassword(password, invalidHash)
      ).resolves.toBe(false);
    });
  });
});
