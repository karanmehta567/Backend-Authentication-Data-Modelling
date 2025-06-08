# 🔐 Backend Security Measures: Tokenization, Hashing, and Best Practices

This document outlines core security concepts and best practices for backend systems involving **authentication**, **data modeling**, **password protection**, and more.

---

## 📌 1. Tokenization

**Tokenization** is the process of replacing sensitive data with a non-sensitive equivalent (token) that has no exploitable value.

### 🔧 Common Usage:
- JWT (JSON Web Tokens) for user authentication
- OAuth tokens for third-party API access

### ✅ Best Practices:
- Always sign tokens with a secure `SECRET_KEY`
- Use short expiry for access tokens (e.g., 15–30 minutes)
- Use refresh tokens for session longevity
- Store tokens securely (preferably HTTP-only cookies)

```js
import jwt from 'jsonwebtoken';

const payload = { userId: user._id };
const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
