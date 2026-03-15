const authMiddleware = require("../auth.middleware");
const { generateToken } = require("../../utils/jwt.util");
const { User } = require("../../models/User.model");

// Mock the User model
jest.mock("../../models/User.model");

// Mock environment variable
process.env.JWT_SECRET = "test_secret_key_for_testing";

describe("Auth Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      cookies: {},
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe("Token extraction", () => {
    it("should extract token from cookies", async () => {
      const userId = "user123";
      const userRole = "USER";
      const token = generateToken(userId, userRole);

      req.cookies.token = token;

      const mockUser = {
        _id: userId,
        name: "Test User",
        email: "test@example.com",
        role: userRole,
        isActive: true,
      };

      User.findById = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUser),
      });

      await authMiddleware(req, res, next);

      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });

    it("should extract token from Authorization header", async () => {
      const userId = "user456";
      const userRole = "SHOP";
      const token = generateToken(userId, userRole);

      req.headers.authorization = `Bearer ${token}`;

      const mockUser = {
        _id: userId,
        name: "Shop User",
        email: "shop@example.com",
        role: userRole,
        isActive: true,
      };

      User.findById = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUser),
      });

      await authMiddleware(req, res, next);

      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });

    it("should prioritize cookie token over header token", async () => {
      const cookieUserId = "user123";
      const headerUserId = "user456";
      const cookieToken = generateToken(cookieUserId, "USER");
      const headerToken = generateToken(headerUserId, "USER");

      req.cookies.token = cookieToken;
      req.headers.authorization = `Bearer ${headerToken}`;

      const mockUser = {
        _id: cookieUserId,
        name: "Cookie User",
        email: "cookie@example.com",
        role: "USER",
        isActive: true,
      };

      User.findById = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUser),
      });

      await authMiddleware(req, res, next);

      expect(User.findById).toHaveBeenCalledWith(cookieUserId);
      expect(req.user).toEqual(mockUser);
    });
  });

  describe("Token validation", () => {
    it("should return 401 if no token provided", async () => {
      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 for invalid token", async () => {
      req.cookies.token = "invalid.token.here";

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid token" });
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 for expired token", async () => {
      const jwt = require("jsonwebtoken");
      const expiredToken = jwt.sign(
        { id: "user123", role: "USER" },
        process.env.JWT_SECRET,
        { expiresIn: "0s" }
      );

      req.cookies.token = expiredToken;

      // Wait to ensure token is expired
      await new Promise((resolve) => setTimeout(resolve, 100));

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid token" });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("User validation", () => {
    it("should return 401 if user not found", async () => {
      const userId = "nonexistent";
      const token = generateToken(userId, "USER");

      req.cookies.token = token;

      User.findById = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid user" });
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 if user is not active", async () => {
      const userId = "user123";
      const token = generateToken(userId, "USER");

      req.cookies.token = token;

      const inactiveUser = {
        _id: userId,
        name: "Inactive User",
        email: "inactive@example.com",
        role: "USER",
        isActive: false,
      };

      User.findById = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(inactiveUser),
      });

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid user" });
      expect(next).not.toHaveBeenCalled();
    });

    it("should attach user to request for active user", async () => {
      const userId = "user123";
      const userRole = "USER";
      const token = generateToken(userId, userRole);

      req.cookies.token = token;

      const mockUser = {
        _id: userId,
        name: "Active User",
        email: "active@example.com",
        role: userRole,
        isActive: true,
      };

      User.findById = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUser),
      });

      await authMiddleware(req, res, next);

      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("Role handling", () => {
    it("should correctly handle USER role", async () => {
      const userId = "user123";
      const token = generateToken(userId, "USER");

      req.cookies.token = token;

      const mockUser = {
        _id: userId,
        name: "Regular User",
        email: "user@example.com",
        role: "USER",
        isActive: true,
      };

      User.findById = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUser),
      });

      await authMiddleware(req, res, next);

      expect(req.user.role).toBe("USER");
      expect(next).toHaveBeenCalled();
    });

    it("should correctly handle SHOP role", async () => {
      const userId = "shop123";
      const token = generateToken(userId, "SHOP");

      req.cookies.token = token;

      const mockUser = {
        _id: userId,
        name: "Shop Owner",
        email: "shop@example.com",
        role: "SHOP",
        isActive: true,
      };

      User.findById = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUser),
      });

      await authMiddleware(req, res, next);

      expect(req.user.role).toBe("SHOP");
      expect(next).toHaveBeenCalled();
    });

    it("should correctly handle ADMIN role", async () => {
      const userId = "admin123";
      const token = generateToken(userId, "ADMIN");

      req.cookies.token = token;

      const mockUser = {
        _id: userId,
        name: "Admin User",
        email: "admin@example.com",
        role: "ADMIN",
        isActive: true,
      };

      User.findById = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUser),
      });

      await authMiddleware(req, res, next);

      expect(req.user.role).toBe("ADMIN");
      expect(next).toHaveBeenCalled();
    });
  });

  describe("Error handling", () => {
    it("should handle database errors gracefully", async () => {
      const userId = "user123";
      const token = generateToken(userId, "USER");

      req.cookies.token = token;

      User.findById = jest.fn().mockReturnValue({
        lean: jest.fn().mockRejectedValue(new Error("Database error")),
      });

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid token" });
      expect(next).not.toHaveBeenCalled();
    });

    it("should handle malformed Authorization header", async () => {
      req.headers.authorization = "InvalidFormat";

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
