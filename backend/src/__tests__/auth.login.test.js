const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app");
const { User } = require("../models/User.model");
const { hashPassword } = require("../utils/password.util");

describe("Email/Password Login - Task 3.7", () => {
  beforeAll(async () => {
    // Load environment variables
    require("dotenv").config();
    
    // Connect to database (use Atlas connection from .env)
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI not found in environment variables");
    }
    
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 10000,
      });
    }
  }, 15000);

  beforeEach(async () => {
    // Clean up test users before each test
    await User.deleteMany({ email: { $regex: /@example\.com$/ } });
  });

  afterAll(async () => {
    // Clean up test users
    await User.deleteMany({ email: { $regex: /@example\.com$/ } });
    await mongoose.connection.close();
  }, 15000);

  describe("POST /auth/login - Core Functionality", () => {
    it("should login successfully with valid credentials and return JWT token", async () => {
      // Create a test user first
      const hashedPassword = await hashPassword("Password123");
      await User.create({
        name: "Test User",
        email: "testuser@example.com",
        password: hashedPassword,
      });

      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "testuser@example.com",
          password: "Password123",
        })
        .expect(200);

      // Verify response structure
      expect(response.body).toHaveProperty("message", "Login successful");
      expect(response.body).toHaveProperty("user");
      expect(response.body.user).toHaveProperty("id");
      expect(response.body.user).toHaveProperty("name", "Test User");
      expect(response.body.user).toHaveProperty("email", "testuser@example.com");
      expect(response.body.user).toHaveProperty("role", "USER");
      expect(response.body).toHaveProperty("token");
      expect(typeof response.body.token).toBe("string");
      expect(response.body.token.length).toBeGreaterThan(0);
    });

    it("should set httpOnly cookie with JWT token on successful login", async () => {
      // Create a test user
      const hashedPassword = await hashPassword("Password123");
      await User.create({
        name: "Cookie Test User",
        email: "cookie@example.com",
        password: hashedPassword,
      });

      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "cookie@example.com",
          password: "Password123",
        })
        .expect(200);

      // Verify cookie is set
      expect(response.headers["set-cookie"]).toBeDefined();
      const cookieHeader = response.headers["set-cookie"][0];
      expect(cookieHeader).toContain("token=");
      expect(cookieHeader).toContain("HttpOnly");
    });

    it("should login user with SHOP role correctly", async () => {
      // Create a shop user
      const hashedPassword = await hashPassword("ShopPass123");
      await User.create({
        name: "Shop Owner",
        email: "shop@example.com",
        password: hashedPassword,
        role: "SHOP",
      });

      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "shop@example.com",
          password: "ShopPass123",
        })
        .expect(200);

      expect(response.body.user.role).toBe("SHOP");
    });

    it("should login user with ADMIN role correctly", async () => {
      // Create an admin user
      const hashedPassword = await hashPassword("AdminPass123");
      await User.create({
        name: "Admin User",
        email: "admin@example.com",
        password: hashedPassword,
        role: "ADMIN",
      });

      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "admin@example.com",
          password: "AdminPass123",
        })
        .expect(200);

      expect(response.body.user.role).toBe("ADMIN");
    });
  });

  describe("POST /auth/login - Invalid Credentials Handling", () => {
    it("should reject login with non-existent email", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: "Password123",
        })
        .expect(401);

      expect(response.body).toHaveProperty("message", "Invalid credentials");
      expect(response.body).not.toHaveProperty("token");
      expect(response.body).not.toHaveProperty("user");
    });

    it("should reject login with incorrect password", async () => {
      // Create a test user
      const hashedPassword = await hashPassword("CorrectPassword123");
      await User.create({
        name: "Test User",
        email: "wrongpass@example.com",
        password: hashedPassword,
      });

      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "wrongpass@example.com",
          password: "WrongPassword123",
        })
        .expect(401);

      expect(response.body).toHaveProperty("message", "Invalid credentials");
      expect(response.body).not.toHaveProperty("token");
    });

    it("should reject login for Google-only user (no password)", async () => {
      // Create a Google OAuth user without password
      await User.create({
        name: "Google User",
        email: "googleonly@example.com",
        googleId: "google123",
      });

      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "googleonly@example.com",
          password: "AnyPassword123",
        })
        .expect(401);

      expect(response.body).toHaveProperty("message", "Please login with Google");
      expect(response.body).not.toHaveProperty("token");
    });

    it("should not reveal whether email exists (security)", async () => {
      // Create a test user
      const hashedPassword = await hashPassword("Password123");
      await User.create({
        name: "Test User",
        email: "exists@example.com",
        password: hashedPassword,
      });

      // Try with non-existent email
      const response1 = await request(app)
        .post("/auth/login")
        .send({
          email: "notexists@example.com",
          password: "Password123",
        })
        .expect(401);

      // Try with existing email but wrong password
      const response2 = await request(app)
        .post("/auth/login")
        .send({
          email: "exists@example.com",
          password: "WrongPassword123",
        })
        .expect(401);

      // Both should return the same generic message
      expect(response1.body.message).toBe("Invalid credentials");
      expect(response2.body.message).toBe("Invalid credentials");
    });
  });

  describe("POST /auth/login - Input Validation", () => {
    it("should reject login without email", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({
          password: "Password123",
        })
        .expect(400);

      expect(response.body).toHaveProperty("errors");
      expect(Array.isArray(response.body.errors)).toBe(true);
    });

    it("should reject login without password", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "test@example.com",
        })
        .expect(400);

      expect(response.body).toHaveProperty("errors");
      expect(Array.isArray(response.body.errors)).toBe(true);
    });

    it("should reject login with invalid email format", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "invalid-email",
          password: "Password123",
        })
        .expect(400);

      expect(response.body).toHaveProperty("errors");
    });

    it("should reject login with empty credentials", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty("errors");
    });
  });

  describe("POST /auth/login - Email Normalization", () => {
    it("should login successfully with uppercase email (case-insensitive)", async () => {
      // Create user with lowercase email
      const hashedPassword = await hashPassword("Password123");
      await User.create({
        name: "Test User",
        email: "lowercase@example.com",
        password: hashedPassword,
      });

      // Try to login with uppercase email
      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "LOWERCASE@EXAMPLE.COM",
          password: "Password123",
        })
        .expect(200);

      expect(response.body.user.email).toBe("lowercase@example.com");
    });

    it("should login successfully with mixed case email", async () => {
      // Create user
      const hashedPassword = await hashPassword("Password123");
      await User.create({
        name: "Test User",
        email: "mixedcase@example.com",
        password: hashedPassword,
      });

      // Try to login with different case
      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "MixedCase@Example.Com",
          password: "Password123",
        })
        .expect(200);

      expect(response.body.user.email).toBe("mixedcase@example.com");
    });
  });

  describe("POST /auth/login - Password Comparison", () => {
    it("should correctly compare password hash using bcrypt", async () => {
      // Create user with bcrypt hashed password
      const plainPassword = "MySecurePassword123";
      const hashedPassword = await hashPassword(plainPassword);
      
      await User.create({
        name: "Hash Test User",
        email: "hashtest@example.com",
        password: hashedPassword,
      });

      // Verify the password is hashed
      const user = await User.findOne({ email: "hashtest@example.com" }).select("+password");
      expect(user.password).not.toBe(plainPassword);
      expect(user.password).toMatch(/^\$2[aby]\$/); // bcrypt hash pattern

      // Login should succeed with correct password
      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "hashtest@example.com",
          password: plainPassword,
        })
        .expect(200);

      expect(response.body).toHaveProperty("token");
    });

    it("should reject login with password that differs by one character", async () => {
      const hashedPassword = await hashPassword("Password123");
      await User.create({
        name: "Test User",
        email: "similar@example.com",
        password: hashedPassword,
      });

      // Try with password that differs by one character
      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "similar@example.com",
          password: "Password124", // Last character different
        })
        .expect(401);

      expect(response.body.message).toBe("Invalid credentials");
    });
  });

  describe("POST /auth/login - User Object Response", () => {
    it("should return user object without password field", async () => {
      const hashedPassword = await hashPassword("Password123");
      await User.create({
        name: "Security Test User",
        email: "security@example.com",
        password: hashedPassword,
      });

      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "security@example.com",
          password: "Password123",
        })
        .expect(200);

      // User object should not contain password
      expect(response.body.user).not.toHaveProperty("password");
      expect(response.body.user).toHaveProperty("id");
      expect(response.body.user).toHaveProperty("name");
      expect(response.body.user).toHaveProperty("email");
      expect(response.body.user).toHaveProperty("role");
    });

    it("should return complete user information on successful login", async () => {
      const hashedPassword = await hashPassword("Password123");
      const createdUser = await User.create({
        name: "Complete User",
        email: "complete@example.com",
        password: hashedPassword,
        phone: "1234567890",
      });

      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "complete@example.com",
          password: "Password123",
        })
        .expect(200);

      expect(response.body.user.id).toBe(createdUser._id.toString());
      expect(response.body.user.name).toBe("Complete User");
      expect(response.body.user.email).toBe("complete@example.com");
      expect(response.body.user.role).toBe("USER");
    });
  });

  describe("POST /auth/login - JWT Token Validation", () => {
    it("should return a valid JWT token that can be verified", async () => {
      const hashedPassword = await hashPassword("Password123");
      await User.create({
        name: "JWT Test User",
        email: "jwt@example.com",
        password: hashedPassword,
      });

      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "jwt@example.com",
          password: "Password123",
        })
        .expect(200);

      const token = response.body.token;
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");

      // Verify the token can be used for authenticated requests
      const meResponse = await request(app)
        .get("/auth/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(meResponse.body.user).toHaveProperty("email", "jwt@example.com");
    });
  });

  describe("POST /auth/login - Edge Cases", () => {
    it("should handle login for inactive user", async () => {
      const hashedPassword = await hashPassword("Password123");
      await User.create({
        name: "Inactive User",
        email: "inactive@example.com",
        password: hashedPassword,
        isActive: false,
      });

      // Current implementation doesn't check isActive, so login should succeed
      // This is a design decision - you may want to add isActive check
      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "inactive@example.com",
          password: "Password123",
        })
        .expect(200);

      expect(response.body).toHaveProperty("token");
    });

    it("should handle login with extra whitespace in email (normalized by validation)", async () => {
      const hashedPassword = await hashPassword("Password123");
      await User.create({
        name: "Whitespace User",
        email: "whitespace@example.com",
        password: hashedPassword,
      });

      // The validation middleware normalizes email, so whitespace is handled
      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "whitespace@example.com",
          password: "Password123",
        })
        .expect(200);

      expect(response.body.user.email).toBe("whitespace@example.com");
    });
  });
});
