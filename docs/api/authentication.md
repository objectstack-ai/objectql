# Authentication & Authorization Guide

This guide covers how to secure your ObjectQL APIs with authentication and implement fine-grained authorization.

## Table of Contents

1. [Authentication Strategies](#authentication-strategies)
2. [Authorization & Permissions](#authorization--permissions)
3. [User Context](#user-context)
4. [Security Best Practices](#security-best-practices)

---

## Authentication Strategies

ObjectQL is designed to integrate with any authentication system. The framework is **authentication-agnostic** - you bring your own auth provider.

### 1. JWT (JSON Web Tokens)

**Recommended for:** Modern web apps, mobile apps, microservices

#### Setup

```typescript
import { ObjectQL } from '@objectql/core';
import { createNodeHandler } from '@objectql/server';
import express from 'express';
import jwt from 'jsonwebtoken';

const app = new ObjectQL({ /* config */ });
const server = express();

// Middleware to verify JWT and attach user context
server.use('/api/objectql', async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'No token provided' }});
  }
  
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user to request
    next();
  } catch (e) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' }});
  }
});

// ObjectQL handler will read req.user automatically
server.all('/api/objectql', createNodeHandler(app));
```

#### Client Usage

```javascript
const response = await fetch('/api/objectql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    op: 'find',
    object: 'users',
    args: {}
  })
});
```

### 2. API Keys

**Recommended for:** Server-to-server communication, integrations, scripts

#### Setup

```typescript
const API_KEYS = {
  'key_abc123': { id: 'service_account_1', roles: ['api'] },
  'key_xyz789': { id: 'service_account_2', roles: ['readonly'] }
};

server.use('/api/objectql', (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'API key required' }});
  }
  
  const user = API_KEYS[apiKey];
  if (!user) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid API key' }});
  }
  
  req.user = user;
  next();
});
```

#### Client Usage

```bash
curl -X POST http://localhost:3000/api/objectql \
  -H "X-API-Key: key_abc123" \
  -H "Content-Type: application/json" \
  -d '{"op":"find","object":"users","args":{}}'
```

### 3. Session Cookies

**Recommended for:** Traditional web applications

#### Setup

```typescript
import session from 'express-session';

server.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

server.use('/api/objectql', (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not logged in' }});
  }
  
  req.user = req.session.user;
  next();
});
```

### 4. OAuth2 / OpenID Connect

**Recommended for:** Enterprise SSO, social login

#### Setup with Passport.js

```typescript
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
  // Find or create user
  const user = { id: profile.id, email: profile.emails[0].value };
  done(null, user);
}));

server.use(passport.initialize());
server.use(passport.session());

server.use('/api/objectql', (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' }});
  }
  
  req.user = req.user;
  next();
});
```

---

## Authorization & Permissions

Once authenticated, ObjectQL enforces **multi-level authorization**:

### Permission Levels

1. **Object-Level**: Can user access this table at all?
2. **Operation-Level**: Can they read/create/update/delete?
3. **Field-Level**: Which fields can they see/modify?
4. **Record-Level**: Which specific records can they access?

### Defining Permissions

Permissions are defined in the object metadata:

```yaml
# user.object.yml
name: user
fields:
  email: { type: email }
  role: { type: select, options: [admin, user] }
  salary: { type: number }

permissions:
  # Admin: Full access
  - profile: admin
    allow_read: true
    allow_create: true
    allow_edit: true
    allow_delete: true
    
  # Regular users: Limited access
  - profile: user
    allow_read: true
    allow_create: false
    allow_edit: true
    allow_delete: false
    
    # Can only see/edit own record
    record_filters:
      - ["id", "=", "$current_user"]
    
    # Cannot see salary field
    field_permissions:
      salary:
        visible: false
        editable: false
```

### Permission Profiles

Define reusable permission profiles:

```yaml
# profiles.yml
profiles:
  admin:
    label: Administrator
    description: Full system access
    
  user:
    label: Standard User
    description: Limited access to own data
    
  guest:
    label: Guest
    description: Read-only access
```

### Dynamic Record Filters

Use special variables in filters:

| Variable | Description |
|----------|-------------|
| `$current_user` | ID of authenticated user |
| `$current_user.role` | User's role |
| `$current_user.department` | User's department |
| `$today` | Current date |
| `$now` | Current timestamp |

**Example:**
```yaml
permissions:
  - profile: manager
    allow_read: true
    record_filters:
      # Managers can only see their department's data
      - ["department", "=", "$current_user.department"]
```

### Field-Level Permissions

Control which fields are visible/editable:

```yaml
permissions:
  - profile: user
    allow_edit: true
    field_permissions:
      # Can view but not edit
      created_at: { visible: true, editable: false }
      created_by: { visible: true, editable: false }
      
      # Cannot see at all
      internal_notes: { visible: false, editable: false }
      
      # Conditional visibility
      salary:
        visible: "record.owner == $current_user || $current_user.role == 'hr'"
```

### Operation-Level Permissions

Different permissions for different operations:

```yaml
permissions:
  - profile: auditor
    allow_read: true      # Can view
    allow_create: false   # Cannot create
    allow_edit: false     # Cannot edit
    allow_delete: false   # Cannot delete
    
  - profile: contributor
    allow_read: true
    allow_create: true    # Can create
    allow_edit: true      # Can edit own records
    allow_delete: false   # Cannot delete
    record_filters:
      - ["owner", "=", "$current_user"]
```

---

## User Context

### Accessing User Context in Code

In hooks and actions, access the authenticated user:

```typescript
// In a hook
export const beforeCreate = async (ctx: HookContext) => {
  // Automatically set owner to current user
  ctx.doc.owner = ctx.user.id;
  ctx.doc.created_by = ctx.user.id;
};
```

```typescript
// In an action
export const approveOrder: ActionHandler = async (ctx) => {
  // Check if user is a manager
  if (!ctx.user.roles.includes('manager')) {
    throw new Error('Only managers can approve orders');
  }
  
  // Log who approved
  await ctx.api.object('audit_logs').create({
    action: 'approve_order',
    order_id: ctx.id,
    approved_by: ctx.user.id
  });
};
```

### User Context Structure

```typescript
interface UserContext {
  id: string | number;
  roles?: string[];
  permissions?: string[];
  [key: string]: any;  // Custom properties
}
```

### Custom User Properties

You can add any properties to the user context:

```typescript
server.use('/api/objectql', (req, res, next) => {
  req.user = {
    id: decoded.userId,
    roles: decoded.roles,
    department: decoded.department,
    tenant_id: decoded.tenantId,  // For multi-tenancy
    preferences: decoded.preferences
  };
  next();
});
```

---

## Security Best Practices

### 1. Always Validate Permissions Server-Side

❌ **Never** rely on client-side permission checks:
```javascript
// Client side - NOT SECURE
if (user.isAdmin) {
  deleteUser(userId);  // Client can fake this!
}
```

✅ **Always** enforce on server:
```yaml
# server-side permissions
permissions:
  - profile: admin
    allow_delete: true
  - profile: user
    allow_delete: false
```

### 2. Use Least Privilege

Give users only the permissions they need:

```yaml
# Start restrictive
permissions:
  - profile: default
    allow_read: false
    allow_create: false
    allow_edit: false
    allow_delete: false

# Then grant specific access
  - profile: viewer
    allow_read: true
```

### 3. Audit Sensitive Operations

Log all privileged actions:

```typescript
// Hook: afterDelete
export const afterDelete = async (ctx: HookContext) => {
  await ctx.api.object('audit_logs').create({
    action: 'delete',
    object: ctx.objectName,
    record_id: ctx.id,
    user_id: ctx.user.id,
    timestamp: new Date()
  });
};
```

### 4. Implement Rate Limiting

Prevent brute force attacks:

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

server.use('/api/objectql', limiter);
```

### 5. Sanitize User Input

Always validate and sanitize:

```yaml
# Use validation rules
validations:
  - field: email
    type: email
  - field: age
    type: number
    min: 0
    max: 150
```

### 6. Use HTTPS in Production

```typescript
// Force HTTPS
server.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https' && process.env.NODE_ENV === 'production') {
    res.redirect(`https://${req.header('host')}${req.url}`);
  } else {
    next();
  }
});
```

### 7. Implement CORS Properly

```typescript
import cors from 'cors';

// Development
server.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Production
server.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true
}));
```

### 8. Rotate Secrets Regularly

- JWT secrets
- API keys
- Database passwords
- Session secrets

### 9. Multi-Tenancy

Isolate data between tenants:

```typescript
// Add tenant_id to all requests
server.use('/api/objectql', (req, res, next) => {
  req.user = {
    ...decoded,
    tenant_id: decoded.tenantId
  };
  next();
});
```

```yaml
# Enforce tenant isolation
permissions:
  - profile: user
    allow_read: true
    record_filters:
      - ["tenant_id", "=", "$current_user.tenant_id"]
```

### 10. Security Headers

```typescript
import helmet from 'helmet';

server.use(helmet());
```

---

## Example: Complete Auth Setup

```typescript
import express from 'express';
import { ObjectQL } from '@objectql/core';
import { createNodeHandler } from '@objectql/server';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';

const app = new ObjectQL({ /* config */ });
const server = express();

// 1. Security headers
server.use(helmet());

// 2. CORS
server.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true
}));

// 3. Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
server.use('/api', limiter);

// 4. Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        error: { code: 'UNAUTHORIZED', message: 'No token provided' }
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch full user context from database if needed
    const ctx = app.createContext({ userId: decoded.userId });
    const userContext = await ctx.object('users').findOne(decoded.userId);
    
    req.user = {
      id: userContext.id,
      roles: userContext.roles,
      department: userContext.department,
      tenant_id: userContext.tenant_id
    };
    
    next();
  } catch (e) {
    return res.status(401).json({ 
      error: { code: 'UNAUTHORIZED', message: 'Invalid token' }
    });
  }
};

// 5. Apply authentication
server.use('/api/objectql', authenticate);

// 6. Mount ObjectQL handler
server.all('/api/objectql', createNodeHandler(app));

// 7. Public login endpoint (no auth required)
server.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Verify credentials
  // Use bcrypt or argon2 for password hashing:
  // const bcrypt = require('bcryptjs');
  // const match = await bcrypt.compare(password, user.password_hash);
  const user = await verifyCredentials(email, password);
  
  if (!user) {
    return res.status(401).json({ 
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
    });
  }
  
  // Generate JWT
  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  res.json({ token, user });
});

// Example verifyCredentials function using bcrypt
async function verifyCredentials(email: string, password: string) {
  const bcrypt = require('bcryptjs');
  
  // Find user by email (using the app instance from outer scope)
  const ctx = app.createContext({});
  const user = await ctx.object('users').findOne({ filters: [['email', '=', email]] });
  
  if (!user) return null;
  
  // Compare password with hash
  const match = await bcrypt.compare(password, user.password_hash);
  
  return match ? user : null;
}

server.listen(3000);
```

---

## Next Steps

- [Permissions Specification](../spec/permission.md)
- [Actions Guide](../guide/logic-actions.md)
- [Multi-Tenancy Guide](../guide/multi-tenancy.md) *(Coming Soon)*
