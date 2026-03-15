# Password Hashing Implementation

## Overview

This document describes the password hashing implementation for the AMMUFOODS system using bcrypt.

## Implementation Details

### Salt Rounds
- **Value**: 10 salt rounds
- **Rationale**: Provides strong security while maintaining reasonable performance
- **Security**: Each password gets a unique salt, making rainbow table attacks ineffective

### Functions

#### `hashPassword(password)`
Hashes a plain text password using bcrypt with 10 salt rounds.

**Parameters:**
- `password` (string): Plain text password to hash

**Returns:**
- Promise<string>: Bcrypt hashed password (60 characters)

**Throws:**
- Error if password is empty, null, undefined, or not a string

**Example:**
```javascript
const { hashPassword } = require('./utils/password.util');

const hashedPassword = await hashPassword('mySecurePassword123');
// Returns: $2b$10$... (60 character bcrypt hash)
```

#### `comparePassword(password, hashedPassword)`
Compares a plain text password with a bcrypt hash.

**Parameters:**
- `password` (string): Plain text password to verify
- `hashedPassword` (string): Bcrypt hash to compare against

**Returns:**
- Promise<boolean>: true if passwords match, false otherwise

**Throws:**
- Error if password or hashedPassword is empty, null, undefined, or not a string

**Example:**
```javascript
const { comparePassword } = require('./utils/password.util');

const isValid = await comparePassword('myPassword', hashedPassword);
// Returns: true or false
```

## Security Features

### 1. Salt Generation
- Each password gets a unique random salt
- Salt is automatically included in the hash
- Same password produces different hashes

### 2. One-Way Hashing
- Impossible to reverse the hash to get the original password
- Only comparison is possible, not decryption

### 3. Timing Attack Resistance
- bcrypt's compare function is designed to be constant-time
- Prevents timing-based attacks

### 4. Cost Factor
- 10 rounds = 2^10 = 1024 iterations
- Adjustable if security requirements change
- Higher rounds = more secure but slower

## Usage in Authentication

### User Registration
```javascript
const { hashPassword } = require('./utils/password.util');

// When user signs up
const plainPassword = req.body.password;
const hashedPassword = await hashPassword(plainPassword);

// Store hashedPassword in database, NEVER store plainPassword
const user = await User.create({
  email: req.body.email,
  password: hashedPassword, // Store hash, not plaintext
  name: req.body.name
});
```

### User Login
```javascript
const { comparePassword } = require('./utils/password.util');

// When user logs in
const user = await User.findOne({ email: req.body.email });

if (!user) {
  return res.status(401).json({ error: 'Invalid credentials' });
}

const isPasswordValid = await comparePassword(req.body.password, user.password);

if (!isPasswordValid) {
  return res.status(401).json({ error: 'Invalid credentials' });
}

// Password is valid, proceed with login
```

## Testing

### Test Coverage
- 39 unit tests covering all functionality
- Tests for valid inputs, edge cases, and error conditions
- Integration tests for hash-compare cycles
- Security tests for plaintext protection

### Key Test Scenarios
1. Valid password hashing
2. Hash format validation (bcrypt format)
3. Salt rounds verification (10 rounds)
4. Unique hash generation for same password
5. Correct password comparison (true/false)
6. Error handling (null, undefined, empty, non-string)
7. Special characters and unicode support
8. Case sensitivity
9. Concurrent operations
10. Security properties (no plaintext storage)

## Requirements Validation

**Validates: Security Requirements (Security.8)**
- ✅ Passwords are hashed with bcrypt
- ✅ Salt rounds set to 10
- ✅ Never stores plaintext passwords
- ✅ Secure comparison function
- ✅ Comprehensive error handling

**Validates: Property 22 - Password hashing**
*For any user created with email/password authentication, the password field in the database should be a bcrypt hash, not the plaintext password.*

## Performance Considerations

### Hashing Time
- Approximately 60-120ms per hash (depends on hardware)
- Acceptable for user registration (one-time operation)
- May need optimization for bulk operations

### Comparison Time
- Approximately 60-120ms per comparison
- Acceptable for login operations
- Constant-time comparison prevents timing attacks

## Best Practices

### DO:
✅ Always hash passwords before storing in database
✅ Use the provided `hashPassword` function for consistency
✅ Use `comparePassword` for verification
✅ Handle errors appropriately
✅ Validate password strength before hashing (min 8 characters recommended)

### DON'T:
❌ Never store plaintext passwords
❌ Never log passwords (plain or hashed)
❌ Never send passwords in API responses
❌ Never use custom hashing implementations
❌ Never skip error handling

## Future Enhancements

### Potential Improvements
1. **Adaptive Cost Factor**: Increase salt rounds as hardware improves
2. **Password Strength Validation**: Enforce minimum complexity requirements
3. **Rate Limiting**: Prevent brute force attacks on login
4. **Password History**: Prevent password reuse
5. **Multi-Factor Authentication**: Add additional security layer

## References

- [bcrypt npm package](https://www.npmjs.com/package/bcryptjs)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [bcrypt Algorithm](https://en.wikipedia.org/wiki/Bcrypt)

## Compliance

This implementation follows:
- OWASP security guidelines
- Industry best practices for password storage
- AMMUFOODS system security requirements
- Property-based testing requirements
