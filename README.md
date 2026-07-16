# express-mongo-jwt-api

A small, production-shaped reference API: Node.js, Express, MongoDB (Mongoose), JWT, written in TypeScript.

## What this demonstrates

This is a proof-of-approach for a common client task: replacing mocked/fake auth with real JWT auth, and wiring protected routes to a live MongoDB backend, with the security basics a client would expect in a real handoff.

Specifically it shows:

- Real auth: register (bcrypt-hashed passwords), login (JWT access token), `/auth/me` reading the current user off the token, not off a client-supplied id.
- A protected, owned resource (`/items`) proving the pattern for wiring any dashboard screen to Mongo behind auth: every document is scoped to `owner`, every read and write is checked against the token's user, cross-user access returns 404 rather than leaking that the resource exists.
- JWT middleware that rejects missing, malformed, invalid, and expired tokens, all with a clean 401 and no stack traces.
- Security hardening: helmet, a CORS allowlist read from env (not `*`), rate limiting on the auth routes, zod validation on every request body, and a centralized error handler that never leaks internals (no stack traces, no driver error messages) to the client.
- No secrets committed, `.env.example` documents `JWT_SECRET`, `MONGO_URI`, `CORS_ORIGINS`.

## Stack

Express 4, Mongoose 8, jsonwebtoken, bcryptjs, helmet, cors, express-rate-limit, zod, TypeScript. Tests with Jest, supertest, mongodb-memory-server.

## Project structure

```
src/
  app.ts              build the Express app (middleware, routes, error handler)
  server.ts            connect to Mongo, start listening
  config/env.ts         load and validate env vars
  models/               Mongoose schemas (User, Item)
  middleware/            requireAuth, validateBody, rateLimit, errorHandler
  routes/                 auth.routes.ts, items.routes.ts
  controllers/            request handlers
  schemas/                zod request-body schemas
  utils/                  jwt sign/verify, AppError
tests/
  auth.test.ts, items.test.ts, setup.ts (in-memory Mongo lifecycle)
```

## Run it

### With Docker (app + real Mongo)

```
docker-compose up --build
```

The API listens on `http://localhost:3000`. Set `JWT_SECRET` in your shell first if you want something other than the dev default (`docker-compose.yml` reads `${JWT_SECRET:-dev-secret-change-me}`).

### Locally

```
cp .env.example .env      # then edit JWT_SECRET, point MONGO_URI at your Mongo
npm install
npm run dev                # tsx watch, for development
```

Or build and run the compiled output:

```
npm run build
npm start
```

## Test it

Tests run against `mongodb-memory-server`, an in-process Mongo, so `npm test` needs no real database and no Docker:

```
npm test
```

Actual output from the last run on this machine:

```
> express-mongo-jwt-api@1.0.0 test
> jest --runInBand

PASS tests/auth.test.ts (128.623 s)
PASS tests/items.test.ts (59.122 s)

Test Suites: 2 passed, 2 total
Tests:       17 passed, 17 total
Snapshots:   0 total
Time:        204.121 s, estimated 334 s
Ran all test suites.
```

(The run is slow here because the dev box is memory-constrained and mongod's first launch competes for RAM, not because the suite itself is heavy. On a normal machine this finishes in a few seconds.)

Coverage: register (success, duplicate email 409, bad payload 400), login (success, wrong password 401, unknown email 401), `/auth/me` (valid token, no token 401, malformed token 401, expired token 401), and `/items` CRUD (unauthenticated 401, owner create/list, owner read/update/delete, a different user blocked from reading 404, a different user blocked from updating/deleting 404, invalid create payload 400, unknown id 404).

## API summary

| Method | Path          | Auth | Notes                                  |
|--------|---------------|------|-----------------------------------------|
| POST   | /auth/register | no   | `{ email, password }`, rate-limited     |
| POST   | /auth/login    | no   | `{ email, password }`, rate-limited, returns `{ token, user }` |
| GET    | /auth/me       | yes  | current user from the token             |
| POST   | /items         | yes  | `{ title, description? }`               |
| GET    | /items         | yes  | list the caller's own items             |
| GET    | /items/:id     | yes  | 404 if not found or not owned by caller |
| PATCH  | /items/:id     | yes  | partial update, same ownership rule     |
| DELETE | /items/:id     | yes  | 204, same ownership rule                |

## Env vars (`.env.example`)

- `PORT` - server port
- `MONGO_URI` - Mongo connection string
- `JWT_SECRET` - required, no default, the server refuses to boot without it
- `JWT_EXPIRES_IN` - access token lifetime, default `1h`
- `CORS_ORIGINS` - comma-separated allowlist, no origin is allowed if this is empty
