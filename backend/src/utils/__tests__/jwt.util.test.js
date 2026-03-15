const jwt = require("jsonwebtoken");
const { generateToken, verifyToken } = require("../jwt.util");

// Mock environment variable
process.env.JWT_SECRET = "test_secret_key_for_testing";

describe("JWT Utility Functions", () => {
  describe("generateToken", () => {
    it("should generate a valid JWT token with user ID and role", () => {
      const userId = "user123";
      const userRole = "USER";

      const token = generateToken(userId, userRole);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".").length).toBe(3); // JWT has 3 parts
    });

    it("should include user ID in the token payload", () => {
      const userId = "user456";
      const userRole = "SHOP";

      const token = generateToken(userId, userRole);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      expect(decoded.id).toBe(userId);
    });

    it("should include user role in the token payload", () => {
      const userId = "user789";
      const userRole = "ADMIN";

      const token = generateToken(userId, userRole);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      expect(decoded.role).toBe(userRole);
    });

    it("should set token expiration to 7 days", () => {
      const userId = "user123";
      const userRole = "USER";

      const token = generateToken(userId, userRole);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Calculate expected expiration (7 days from now)
      const now = Math.floor(Date.now() / 1000);
      const sevenDaysInSeconds = 7 * 24 * 60 * 60;
      const expectedExpiration = now + sevenDaysInSeconds;

      // Allow 5 seconds tolerance for test execution time
      expect(decoded.exp).toBeGreaterThanOrEqual(expectedExpiration - 5);
      expect(decoded.exp).toBeLessThanOrEqual(expectedExpiration + 5);
    });

    it("should generate different tokens for different users", () => {
      const token1 = generateToken("user1", "USER");
      const token2 = generateToken("user2", "USER");

      expect(token1).not.toBe(token2);
    });

    it("should generate different tokens for different roles", () => {
      const token1 = generateToken("user1", "USER");
      const token2 = generateToken("user1", "ADMIN");

      expect(token1).not.toBe(token2);
    });

    it("should handle all valid role types", () => {
      const roles = ["PUBLIC", "USER", "SHOP", "ADMIN"];
      const userId = "user123";

      roles.forEach((role) => {
        const token = generateToken(userId, role);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        expect(decoded.role).toBe(role);
      });
    });
  });

  describe("verifyToken", () => {
    it("should verify and decode a valid token", () => {
      const userId = "user123";
      const userRole = "USER";
      const token = generateToken(userId, userRole);

      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.id).toBe(userId);
      expect(decoded.role).toBe(userRole);
    });

    it("should throw error for invalid token", () => {
      const invalidToken = "invalid.token.here";

      expect(() => {
        verifyToken(invalidToken);
      }).toThrow();
    });

    it("should throw error for token with wrong secret", () => {
      const token = jwt.sign(
        { id: "user123", role: "USER" },
        "wrong_secret",
        { expiresIn: "7d" }
      );

      expect(() => {
        verifyToken(token);
      }).toThrow();
    });

    it("should throw error for expired token", () => {
      const expiredToken = jwt.sign(
        { id: "user123", role: "USER" },
        process.env.JWT_SECRET,
        { expiresIn: "0s" } // Expires immediately
      );

      // Wait a moment to ensure token is expired
      return new Promise((resolve) => {
        setTimeout(() => {
          expect(() => {
            verifyToken(expiredToken);
          }).toThrow();
          resolve();
        }, 100);
      });
    });

    it("should throw error for malformed token", () => {
      const malformedTokens = [
        "",
        "not.a.token",
        "only.two",
        null,
        undefined,
      ];

      malformedTokens.forEach((token) => {
        expect(() => {
          verifyToken(token);
        }).toThrow();
      });
    });

    it("should return token with iat (issued at) timestamp", () => {
      const userId = "user123";
      const userRole = "USER";
      const token = generateToken(userId, userRole);

      const decoded = verifyToken(token);

      expect(decoded.iat).toBeDefined();
      expect(typeof decoded.iat).toBe("number");
    });

    it("should return token with exp (expiration) timestamp", () => {
      const userId = "user123";
      const userRole = "USER";
      const token = generateToken(userId, userRole);

      const decoded = verifyToken(token);

      expect(decoded.exp).toBeDefined();
      expect(typeof decoded.exp).toBe("number");
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });
  });

  describe("Token lifecycle", () => {
    it("should create and verify token in complete flow", () => {
      const userId = "user123";
      const userRole = "SHOP";

      // Generate token
      const token = generateToken(userId, userRole);
      expect(token).toBeDefined();

      // Verify token
      const decoded = verifyToken(token);
      expect(decoded.id).toBe(userId);
      expect(decoded.role).toBe(userRole);
    });

    it("should maintain token validity for the full 7-day period", () => {
      const userId = "user123";
      const userRole = "USER";
      const token = generateToken(userId, userRole);

      const decoded = verifyToken(token);
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiration = decoded.exp - now;

      // Should be approximately 7 days (604800 seconds)
      // Allow 10 seconds tolerance
      expect(timeUntilExpiration).toBeGreaterThan(604790);
      expect(timeUntilExpiration).toBeLessThan(604810);
    });
  });

  describe("Edge cases", () => {
    it("should handle very long user IDs", () => {
      const longUserId = "a".repeat(1000);
      const userRole = "USER";

      const token = generateToken(longUserId, userRole);
      const decoded = verifyToken(token);

      expect(decoded.id).toBe(longUserId);
    });

    it("should handle special characters in user ID", () => {
      const specialUserId = "user-123_test@domain.com";
      const userRole = "USER";

      const token = generateToken(specialUserId, userRole);
      const decoded = verifyToken(token);

      expect(decoded.id).toBe(specialUserId);
    });

    it("should handle numeric user IDs", () => {
      const numericUserId = 12345;
      const userRole = "USER";

      const token = generateToken(numericUserId, userRole);
      const decoded = verifyToken(token);

      expect(decoded.id).toBe(numericUserId);
    });
  });
});
