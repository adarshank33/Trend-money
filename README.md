# Trend Money Assignment

Small investment and portfolio management platform using the required microservices architecture.

## Architecture

Next.js frontend communicates only with the API Gateway.

The gateway validates JWT authentication and forwards the authenticated user's `userId` to internal services through `x-user-id`.

```text
Next.js
   |
   | REST / HTTP
   v
API Gateway
   |
   +---- Auth Service -------- auth_db
   |
   +---- Product Service ----- product_db
   |
   +---- Order Service ------- order_db
   |          |
   |          +---- Kafka: orders.created
   |          +---- Kafka: orders.processing
   |          +---- Kafka: orders.completed
   |          +---- Kafka: orders.failed
   |                         |
   |                         v
   +---- Portfolio Service --- portfolio_db
                              |
                              +-- processedEvents
```

## Authentication and authorization

Registration and login are public gateway routes because a new user does not have a token yet.

After registration or login, Auth Service creates a JWT containing only the MongoDB user's `_id` as `userId` and sends it as an HTTP-only cookie.

The gateway validates that token on protected requests. A missing, invalid, or expired token returns HTTP `401 Unauthorized`.

Internal services receive the authenticated `userId` from the gateway. User-owned resources are always queried using that ID.

For an order detail request, the Order Service first finds the order. If it exists but belongs to another user, it returns HTTP `403 Forbidden` with `Access denied`. If the order does not exist, it returns `404 Not Found`.

No `role` field is used because the assignment does not require an admin/user role model. Products are shared investment data rather than user-owned data. Product creation/update is authenticated, but ownership is not applied to products because products are shared investment data.

## Status codes

- `200 OK` - successful reads, updates, login and logout
- `201 Created` - successful registration and order/product creation
- `400 Bad Request` - validation errors, invalid IDs, invalid order/product requests
- `401 Unauthorized` - missing/invalid/expired authentication or missing authenticated user
- `403 Forbidden` - authenticated user attempts to access another user's order
- `404 Not Found` - requested product/order/user does not exist
- `409 Conflict` - duplicate email or product symbol
- `502 Bad Gateway` - gateway cannot reach an internal service
- `500 Internal Server Error` - database or unexpected server failure

## Database-per-service

Each service owns a separate MongoDB database:

- `auth_db` - users
- `product_db` - products
- `order_db` - orders
- `portfolio_db` - portfolios and processed Kafka events

Services never query another service's database directly.

## Kafka

Topics are configured through `.env`:

- `orders.created`
- `orders.processing`
- `orders.completed`
- `orders.failed`

Order Service publishes order lifecycle events. It consumes `orders.created` to process orders asynchronously. Portfolio Service consumes `orders.completed` and updates the user's holdings.

Portfolio Service uses `processedEvents.eventId` with a unique index to make completed-order processing idempotent when Kafka delivers a duplicate event.

## Required routes

Gateway:

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/logout`
- `GET /products`
- `GET /products/:id`
- `POST /products`
- `PATCH /products/:id`
- `POST /orders`
- `GET /orders`
- `GET /orders/:id`
- `POST /orders/:id/cancel`
- `GET /portfolio`
- `GET /portfolio/holdings`

Swagger: `http://localhost:3000/docs`

Frontend: `http://localhost:3006`

## Docker

Docker Desktop is required. Kafka and MongoDB do not need to be installed separately.

Create `.env` from `.env.example`, then set a new JWT secret.

```bash
docker compose up -d --build
```

Check services:

```bash
docker compose ps
```

Seed products:

```bash
docker compose exec product-service node scripts/seed-products.js
```

MongoDB Compass can connect from the host using:

```text
mongodb://admin:admin123@localhost:27017/?authSource=admin
```

Inside Docker, services use the hostname `mongodb` instead of `localhost`.

## Local project development

Each NestJS service is an independent Node.js project initialized with its own `package.json`. The frontend is an independent Next.js project.

The root project is only used for Docker and formatting commands.

## Tests

Each backend service contains Jest unit tests for its important behavior.

Run a service test suite from that service directory:

```bash
cd services/auth-service
npm install
npm test
```

The tests cover authentication failures, product lookup/listing, order creation and ownership checks, Kafka event publication through the order flow, and portfolio duplicate-event handling.
