# Rate Limiting and Throttling

Learn how to configure rate limiting to protect your ObjectQL APIs from abuse. This guide covers rate limit strategies, configuration options, and response headers for throttled requests.

## Default Limits

| Tier | Requests/Minute | Requests/Hour |
|------|-----------------|---------------|
| Anonymous | 20 | 100 |
| Authenticated | 100 | 1000 |
| Premium | 500 | 10000 |

## Rate Limit Headers

All responses include rate limit information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642258800
```

## Rate Limit Exceeded

When rate limit is exceeded:

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "details": {
      "retry_after": 60
    }
  }
}
```

**HTTP Status**: `429 Too Many Requests`
