const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app");
const { User } = require("../models/User.model");

describe("Email/Password Registration - Task 3.5", () => {
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

  describe("POST /auth/signup - Core Functionality", () => {
    it("should create a new user with valid input and return JWT token", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "Password123",
      };

      const response = await request(app)
        .post("/auth/signup")
        .send(userData)
        .expect(201);

      // Verify response structure
      expect(response.body).toHaveProperty("message", "Signup successful");
      expect(response.body).toHaveProperty("user");
      expect(response.body.user).toHaveProperty("id");
      expect(response.body.user).toHaveProperty("name", userData.name);
      expect(response.body.user).toHaveProperty("email", userData.email);
      expect(response.body.user).toHaveProperty("role", "USER");
      expect(response.body).toHaveProperty("token");
      expect(typeof response.body.token).toBe("string");

      // Verify user was created in database
      const user = await User.findOne({ email: userData.email });
      expect(user).toBeTruthy();
      expect(user.name).toBe(userData.name);
      expect(user.email).toBe(userData.email);
      expect(user.role).toBe("USER");
      expect(user.isActive).toBe(true);
    });

    it("should hash the password before storing", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "MyPassword789",
      };

      await request(app)
        .post("/auth/signup")
        .send(userData)
        .expect(201);

      // Retrieve user with password field
      const user = await User.findOne({ email: userData.email }).select("+password");
      expect(user.password).toBeTruthy();
      expect(user.password).not.toBe(userData.password); // Password should be hashed
      expect(user.password).toMatch(/^\$2[aby]\$/); // bcrypt hash pattern
    });

    it("should reject registration with duplicate email", async () => {
      const userData = {
        name: "First User",
        email: "duplicate@example.com",
        password: "Password123",
      };

      // Create first user
      await request(app)
        .post("/auth/signup")
        .send(userData)
        .expect(201);

      // Try to create second user with same email
      const response = await request(app)
        .post("/auth/signup")
        .send({
          name: "Second User",
          email: "duplicate@example.com",
          password: "DifferentPass456",
        })
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("already registered");
    });

    it("should add password to existing Google OAuth user (unified auth)", async () => {
      // Create user with Google OAuth (no password)
      const googleUser = await User.create({
        name: "Google User",
        email: "google@example.com",
        googleId: "google123",
      });

      expect(googleUser.password).toBeUndefined();

      // Try to signup with same email
      const response = await request(app)
        .post("/auth/signup")
        .send({
          name: "Google User Updated",
          email: "google@example.com",
          password: "NewPassword123",
        })
        .expect(200);

      expect(response.body.message).toContain("Password added");
      expect(response.body).toHaveProperty("token");

      // Verify password was added
      const updatedUser = await User.findOne({ email: "google@example.com" }).select("+password");
      expect(updatedUser.password).toBeTruthy();
      expect(updatedUser.googleId).toBe("google123"); // Google ID should remain
    });
  });

  describe("POST /auth/signup - Input Validation", () => {
    it("should reject registration without required fields", async () => {
      const response = await request(app)
        .post("/auth/signup")
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty("errors");
      expect(Array.isArray(response.body.errors)).toBe(true);
    });

    it("should reject registration with invalid email format", async () => {
      const response = await request(app)
        .post("/auth/signup")
        .send({
          name: "Test User",
          email: "invalid-email",
          password: "Password123",
        })
        .expect(400);

      expect(response.body).toHaveProperty("errors");
    });

    it("should reject registration with weak password (less than 8 characters)", async () => {
      const response = await request(app)
        .post("/auth/signup")
        .send({
          name: "Test User",
          email: "test@example.com",
          password: "Pass1",
        })
        .expect(400);

      expect(response.body).toHaveProperty("errors");
    });

    it("should reject registration with password missing uppercase letter", async () => {
      const response = await request(app)
        .post("/auth/signup")
        .send({
          name: "Test User",
          email: "test@example.com",
          password: "password123",
        })
        .expect(400);

      expect(response.body).toHaveProperty("errors");
    });

    it("should reject registration with password missing number", async () => {
      const response = await request(app)
        .post("/auth/signup")
        .send({
          name: "Test User",
          email: "test@example.com",
          password: "PasswordOnly",
        })
        .expect(400);

      expect(response.body).toHaveProperty("errors");
    });
  });

  describe("POST /auth/signup - Data Normalization", () => {
    it("should trim whitespace from name", async () => {
      const response = await request(app)
        .post("/auth/signup")
        .send({
          name: "  John Doe  ",
          email: "john2@example.com",
          password: "Password123",
        })
        .expect(201);

      expect(response.body.user.name).toBe("John Doe");
    });

    it("should normalize email to lowercase", async () => {
      const response = await request(app)
        .post("/auth/signup")
        .send({
          name: "Test User",
          email: "TEST@EXAMPLE.COM",
          password: "Password123",
        })
        .expect(201);

      expect(response.body.user.email).toBe("test@example.com");

      const user = await User.findOne({ email: "test@example.com" });
      expect(user).toBeTruthy();
    });
  });
});
