# JWT Token Generation and Verification Implementation

## Overview

This document describes the implementation of JWT (JSON Web Token) token generation and verification for the AMMUFOODS authentication system.

## Implementation Details

### Location
- **Utility Functions**: `backend/src/utils/jwt.util.js`
- **Middleware**: `backend/src/middlewares/auth.middleware.js`
- **Usage**: `backend/src/controllers/auth.controller.js`

### Functions

#### 1. `generateToken(userId, userRole)`

Generates a JWT token containing the user's ID and role.

**Parameters:**
- `userId` (string): The unique identifier of the user
- `userRole` (string): The user's role (USER, SHOP, ADMIN)

**Returns:**
- `string`: A signed JWT token that expires in 7 days

**Token Payload:**
```javascript
{
  id: userId,      // User's unique identifier
  role: userRole,  // User's role for authorization
  iat: timestamp,  // Issued at timestamp (auto-generated)
  exp: timestamp   // Expiration timestamp (7 days from iat)
}
```

**Example Usage:**
```javascript
const token = generateToken("user123", "SHOP");
// Returns: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### 2. `verifyToken(token)`

Verifies a JWT token and returns the decoded payload.

**Parameters:**
- `token` (string): The JWT token to verify

**Returns:**
- `Object`: Decoded token payload containing id, role, iat, and exp

**Throws:**
- `JsonWebTokenError`: If token is invalid or malformed
- `TokenExpiredError`: If token has expired
- `NotBeforeError`: If token is not yet valid

**Example Usage:**
```javascript
const decoded = verifyToken(token);
// Returns: { id: "user123", role: "SHOP", iat: 1234567890, exp: 1235172690 }
```

## Security Features

### 1. Token Expiration
- All tokens expire exactly 7 days after creation
- Expiration is enforced by the JWT library
- Expired tokens are automatically rejected

### 2. Secret Key
- Tokens are signed with a secret key stored in environment variables
- Secret key should be strong and unique for each environment
- Recommended: 256-bit random string

### 3. Token Verification
- All tokens are verified before granting access
- Invalid, expired, or malformed tokens are rejected
- User existence and active status are verified after token validation

## Middleware Integration

The `authMiddleware` uses the JWT utilities to:

1. Extract token from cookies or Authorization header
2. Verify token signature and expiration
3. Fetch user from database using token's user ID
4. Verify user is active
5. Attach user object to request for downstream use

**Token Extraction Priority:**
1. Cookie (`req.cookies.token`)
2. Authorization header (`Bearer <token>`)

## Usage in Authentication Flow

### Signup Flow
```javascript
// 1. User signs up with email/password
// 2. Password is hashed
// 3. User is created in database
// 4. JWT token is generated with user ID and role
const token = generateToken(user._id, user.role);

// 5. Token is sent in response and set as cookie
res.cookie("token", token, { httpOnly: true, secure: true });
res.json({ user, token });
```

### Login Flow
```javascript
// 1. User logs in with email/password
// 2. Credentials are verified
// 3. JWT token is generated with user ID and role
const token = generateToken(user._id, user.role);

// 4. Token is sent in response and set as cookie
res.cookie("token", token, { httpOnly: true, secure: true });
res.json({ user, token });
```

### Google OAuth Flow
```javascript
// 1. User authenticates with Google
// 2. Google token is verified
// 3. User is found or created
// 4. JWT token is generated with user ID and role
const token = generateToken(user._id, user.role);

// 5. Token is sent in response and set as cookie
res.cookie("token", token, { httpOnly: true, secure: true });
res.json({ user, token });
```

### Protected Route Access
```javascript
// 1. Client sends request with token (cookie or header)
// 2. authMiddleware extracts and verifies token
// 3. User is fetched from database
// 4. User object is attached to request
// 5. Route handler can access req.user
```

## Testing

### Unit Tests
Comprehensive unit tests cover:
- Token generation with user ID and role
- Token expiration set to 7 days
- Token verification and decoding
- Invalid token rejection
- Expired token rejection
- Malformed token rejection
- Edge cases (long IDs, special characters, etc.)

### Test Files
- `backend/src/utils/__tests__/jwt.util.test.js` - JWT utility tests (19 tests)
- `backend/src/middlewares/__tests__/auth.middleware.test.js` - Middleware tests (14 tests)

### Test Results
All 33 tests pass successfully:
- ✓ JWT utility functions: 19/19 tests passed
- ✓ Auth middleware: 14/14 tests passed

## Environment Configuration

Required environment variable:
```
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
```

**Production Recommendations:**
- Use a strong, randomly generated secret (256-bit minimum)
- Never commit the secret to version control
- Use different secrets for different environments
- Rotate secrets periodically

## Error Handling

### Common Errors

1. **Missing Token**
   - Status: 401 Unauthorized
   - Message: "Unauthorized"

2. **Invalid Token**
   - Status: 401 Unauthorized
   - Message: "Invalid token"

3. **Expired Token**
   - Status: 401 Unauthorized
   - Message: "Invalid token"

4. **User Not Found**
   - Status: 401 Unauthorized
   - Message: "Invalid user"

5. **Inactive User**
   - Status: 401 Unauthorized
   - Message: "Invalid user"

## Compliance with Requirements

This implementation satisfies the following requirements:

### Task 3.1 Requirements
✓ Create functions for generating JWT tokens with user ID and role
✓ Create middleware for verifying JWT tokens
✓ Set token expiration to 7 days

### Design Document Requirements
✓ JWT tokens include user ID and role
✓ Tokens expire after exactly 7 days
✓ Middleware validates tokens before route access
✓ User existence and active status verified
✓ Secure token signing with secret key

### Security Requirements
✓ Tokens signed with strong secret key
✓ Tokens expire automatically
✓ Invalid tokens rejected
✓ User validation after token verification
✓ httpOnly cookies for XSS protection
✓ Secure cookies in production

## Future Enhancements

Potential improvements for future iterations:

1. **Token Refresh**: Implement refresh tokens for extended sessions
2. **Token Revocation**: Add ability to revoke tokens before expiration
3. **Multiple Devices**: Track tokens per device for better security
4. **Token Blacklist**: Maintain blacklist of revoked tokens
5. **Rate Limiting**: Add rate limiting for token generation
6. **Audit Logging**: Log all token generation and verification events

## Conclusion

The JWT token generation and verification implementation is complete, tested, and ready for production use. It provides secure authentication with proper token expiration, role-based access control, and comprehensive error handling.
