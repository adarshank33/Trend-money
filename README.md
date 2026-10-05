# Trend Money

A small Investment and Portfolio Management Platform built using a microservices architecture.

The project demonstrates:

- Node.js
- TypeScript
- NestJS
- REST APIs
- Next.js
- MongoDB
- Apache Kafka
- JWT authentication
- Database-per-service architecture
- Event-driven order processing
- Order cancellation
- Portfolio and holdings management
- Docker and Docker Compose
- Jest unit testing
- Swagger/OpenAPI documentation
- Postman API testing


## 1. Architecture

The application follows a microservices architecture.

The Next.js frontend communicates only with the API Gateway.

The API Gateway is responsible for:

- Routing requests
- JWT validation
- Authentication
- Forwarding the authenticated user ID
- Propagating downstream service errors
- Returning `502 Bad Gateway` when an internal service is unavailable

Internal services are not directly exposed to the frontend.

```text
                         ┌──────────────────────┐
                         │    Next.js Frontend  │
                         │      Port 3006       │
                         └──────────┬───────────┘
                                    │
                                    │ REST / HTTP
                                    ▼
                         ┌──────────────────────┐
                         │     API Gateway      │
                         │      Port 3000       │
                         │                      │
                         │ JWT validation       │
                         │ Request routing      │
                         │ x-user-id propagation│
                         └──────────┬───────────┘
                                    │
                 ┌──────────────────┼──────────────────┐
                 │                  │                  │
                 ▼                  ▼                  ▼
        ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
        │  Auth Service  │ │Product Service │ │ Order Service  │
        │    auth_db     │ │   product_dbb   │ │    order_db    │
        └────────────────┘ └────────────────┘ └───────┬────────┘
                                                       │
                                                       │ Kafka
                                                       ▼
                                             ┌────────────────────┐
                                             │   Apache Kafka     │
                                             │                    │
                                             │ orders.created     │
                                             │ orders.processing  │
                                             │ orders.completed   │
                                             │ orders.failed      │
                                             └─────────┬──────────┘
                                                       │
                                                       │
                                                       ▼
                                             ┌────────────────────┐
                                             │ Portfolio Service  │
                                             │    portfolio_db    │
                                             │                    │
                                             │ holdings           │
                                             │ processedEvents    │
                                             └────────────────────┘

Order Service ───────────── REST ─────────────► Product Service
```

A rendered architecture diagram is available at:

```text
docs/trends-money-architecture.png
```

The editable architecture source is available at:

```text
docs/architecture.dot
```


## 2. Microservices

The application contains four domain microservices and one API Gateway.

### API Gateway

The API Gateway is the only backend entry point exposed to the frontend.

Responsibilities:

- Public API entry point
- JWT authentication and validation
- Request routing
- Forwarding authenticated requests
- Adding `x-user-id` to internal requests
- Downstream error propagation
- Returning `502 Bad Gateway` when an internal service is unavailable

Internal service ports are not published to the host.

### Auth Service

Responsibilities:

- User registration
- User login
- JWT generation
- Current-user information
- Logout

Database:

```text
auth_db
```

### Product Service

Responsibilities:

- Investment product management
- Product listing
- Product details
- Product creation
- Product updates
- Search
- Pagination
- Filtering

Database:

```text
product_dbb
```

### Order Service

Responsibilities:

- Order creation
- Product validation
- Order ownership
- Order listing
- Order details
- Order cancellation
- Asynchronous order processing
- Kafka event publishing
- Kafka event consumption

Database:

```text
order_db
```

### Portfolio Service

Responsibilities:

- Portfolio calculation
- Holdings management
- Processing completed order events
- Duplicate event protection

Database:

```text
portfolio_db
```


## 3. Authentication and Authorization

Registration and login are public gateway routes because a new user does not have a token yet.

After successful registration or login, the Auth Service creates a JWT containing the MongoDB user's ID as `userId`.

Example JWT payload:

```json
{
  "userId": "user-id"
}
```

The JWT is sent as an HTTP-only cookie.

For protected requests:

```text
Browser
   |
   v
API Gateway
   |
   | Validate JWT
   |
   | Extract userId
   |
   | Add x-user-id
   v
Internal Service
```

The API Gateway validates:

- Missing token
- Invalid token
- Expired token
- Token without a valid `userId`

Protected requests without valid authentication return:

```text
401 Unauthorized
```

Internal services receive the authenticated `userId` through:

```text
x-user-id
```

User-owned resources are queried using that ID.

For example, when retrieving an order:

1. Find the order.
2. If the order does not exist, return `404 Not Found`.
3. If the order belongs to another user, return `403 Forbidden`.
4. Otherwise return the order.

No role-based authorization is implemented because the assignment does not require an admin/user role model.

Products are shared investment data rather than user-owned resources.


## 4. HTTP Status Codes

The application uses appropriate HTTP status codes for successful operations and errors.

| Status Code | Usage |
|---|---|
| `200 OK` | Successful reads, updates, login and logout |
| `201 Created` | Successful registration and resource creation |
| `400 Bad Request` | Validation errors, invalid IDs and invalid requests |
| `401 Unauthorized` | Missing, invalid or expired authentication |
| `403 Forbidden` | Authenticated user attempts to access another user's order |
| `404 Not Found` | Requested product, order or user does not exist |
| `409 Conflict` | Duplicate email or product symbol |
| `502 Bad Gateway` | API Gateway cannot reach an internal service |
| `500 Internal Server Error` | Database or unexpected server failure |

Examples:

```text
Invalid or missing JWT
        ↓
401 Unauthorized

Order belongs to another user
        ↓
403 Forbidden

Product/order does not exist
        ↓
404 Not Found

Duplicate email/product symbol
        ↓
409 Conflict

Internal service unavailable through Gateway
        ↓
502 Bad Gateway
```


## 5. Database-per-Service

Each service owns a separate logical MongoDB database.

```text
MongoDB
│
├── auth_db
│   └── users
│
├── product_dbb
│   └── products
│
├── order_db
│   └── orders
│
└── portfolio_db
    ├── portfolios / holdings
    └── processedEvents
```

Services never directly query another service's database.

For example:

```text
Order Service
     |
     | REST
     v
Product Service
     |
     v
product_dbb
```

The Order Service does not directly access `product_dbb`.

This keeps service ownership of data separate.


## 6. Product Service

Investment products contain fields such as:

```text
id
name
symbol
type
currentPrice
riskLevel
status
createdAt
updatedAt
```

Supported product types:

```text
MUTUAL_FUND
STOCK
BOND
ETF
```

The Product Service supports:

- Product listing
- Pagination
- Search
- Type filtering
- Active/inactive filtering
- Product details
- Product creation
- Product updates

Product symbols are unique.


## 7. Order Service

The Order Service validates the product through the Product Service before creating an order.

The basic flow is:

```text
Frontend
   |
   v
API Gateway
   |
   v
Order Service
   |
   | Product validation
   v
Product Service
```

If the product does not exist, the order is rejected.

If the product is inactive, the order is rejected.

A valid order is created with:

```text
PENDING
```

and an `orders.created` event is published to Kafka.


## 8. Order Lifecycle

The order lifecycle is event-driven.

```text
                  POST /orders
                       |
                       v
                   PENDING
                       |
                       | orders.created
                       v
                  PROCESSING
                  /         \
                 /           \
                v             v
           COMPLETED        FAILED


PENDING / PROCESSING
        |
        | POST /orders/:id/cancel
        v
     CANCELLED
```

### Processing flow

1. Client creates an order.
2. Order Service validates the product.
3. Order is stored as `PENDING`.
4. Order Service publishes `orders.created`.
5. Order Service consumes `orders.created`.
6. Order changes to `PROCESSING`.
7. `orders.processing` is published.
8. The order is processed asynchronously.
9. The service checks the latest database state.
10. The order changes to `COMPLETED` or `FAILED`.
11. The corresponding Kafka event is published.

A short processing delay is used to make asynchronous processing and cancellation observable during testing.

### Cancellation

Orders can be cancelled while they are:

```text
PENDING
PROCESSING
```

Cancellation endpoint:

```text
POST /orders/:id/cancel
```

Once an order reaches:

```text
COMPLETED
FAILED
CANCELLED
```

it cannot be cancelled again.

Before completing an asynchronously processed order, the Order Service checks the latest database state. This prevents a cancelled order from being changed back to `COMPLETED`.


## 9. Kafka Architecture

Apache Kafka is used as the event broker.

Kafka runs inside Docker Compose, so the reviewer does not need to install Kafka manually.

### Kafka Topics

The application uses the following topics:

```text
orders.created
orders.processing
orders.completed
orders.failed
```

### Order Service

The Order Service acts as both a producer and consumer.

It publishes:

```text
orders.created
orders.processing
orders.completed
orders.failed
```

It consumes:

```text
orders.created
```

### Portfolio Service

The Portfolio Service consumes:

```text
orders.completed
```

and updates the user's portfolio holdings.


## 10. Kafka Producer and Consumer Flow

The order flow can be represented as:

```text
Client
  |
  | POST /orders
  v
Order Service
  |
  | Save PENDING
  |
  | publish
  v
orders.created
  |
  | consume
  v
Order Service
  |
  | Save PROCESSING
  |
  | publish
  v
orders.processing
  |
  | process
  v
Order Service
  |
  +-----> orders.completed
  |
  +-----> orders.failed
              |
              |
              v
       Portfolio Service
       consumes completed events
              |
              v
       Update Holdings
```

Only completed orders affect the portfolio.


## 11. Kafka Consumer Groups

The Order Service uses:

```text
Client ID:
order-service

Consumer Group:
order-processor
```

The Portfolio Service uses:

```text
Client ID:
portfolio-service

Consumer Group:
portfolio-service
```

Separate consumer groups allow each service to consume the events independently according to its responsibility.


## 12. Idempotency Strategy

Kafka systems can deliver duplicate events.

The Portfolio Service protects against duplicate completed-order events using an event ID.

Each event contains a unique:

```text
eventId
```

The Portfolio database maintains processed event information in:

```text
processedEvents
```

The event processing flow is:

```text
Kafka completed event
        |
        v
Check eventId
        |
        +----------------------+
        |                      |
        v                      v
Already processed           New event
        |                      |
        v                      v
Ignore event              Update holding
                               |
                               v
                         Store eventId
```

A unique event ID prevents the same completed order event from being applied to the portfolio multiple times.


## 13. Portfolio and Holdings

The Portfolio Service consumes completed order events.

When an order is completed:

```text
orders.completed
        |
        v
Portfolio Service
        |
        +--> New holding
        |
        +--> Update existing holding
```

The portfolio exposes:

```text
GET /portfolio
GET /portfolio/holdings
```

The portfolio represents the user's holdings based on completed orders.


## 14. API Routes

All frontend-facing backend APIs are exposed through the API Gateway.

### Authentication

```text
POST /auth/register
POST /auth/login
GET  /auth/me
POST /auth/logout
```

### Products

```text
GET   /products
GET   /products/:id
POST  /products
PATCH /products/:id
```

### Orders

```text
POST /orders
GET  /orders
GET  /orders/:id
POST /orders/:id/cancel
```

### Portfolio

```text
GET /portfolio
GET /portfolio/holdings
```


## 15. Swagger / OpenAPI

Swagger/OpenAPI documentation is available through the API Gateway.

After starting the application:

```text
http://localhost:3000/docs
```

Swagger provides interactive documentation for the API routes.

The documented APIs include:

- Authentication
- Products
- Orders
- Order cancellation
- Portfolio

The Swagger UI can be used to inspect request schemas and test the API.


## 16. Postman

A Postman collection is included in:

```text
postman/Trend-Money.postman_collection.json
```

The collection contains the main API flows:

```text
Trend Money API
│
├── Auth
│   ├── Register
│   ├── Login
│   ├── Me
│   └── Logout
│
├── Products
│   ├── List Products
│   ├── Get Product
│   ├── Create Product
│   └── Update Product
│
├── Orders
│   ├── Create Order
│   ├── List Orders
│   ├── Get Order
│   └── Cancel Order
│
└── Portfolio
    ├── Get Portfolio
    └── Get Holdings
```

Additional Postman screenshots and API testing evidence are included in:

```text
docs/Trend-Money-Postman-and-Test-Evidence.pdf
```


## 17. Testing

Jest unit tests are implemented for the backend services.

The current verified test run contains:

```text
Auth Service        2 tests
Product Service     2 tests
Order Service       3 tests
Portfolio Service   2 tests
API Gateway         5 tests
--------------------------------
Total              14 tests
```

All five test suites passed in the recorded test run.

### Auth Service

Current tests cover important authentication failure cases including:

- Duplicate email
- Invalid credentials

Run:

```bash
cd services/auth-service
npm test
```

### Product Service

Current tests cover:

- Paginated product listing
- Product not found

Run:

```bash
cd services/product-service
npm test
```

### Order Service

Current tests cover:

- Valid order creation
- `PENDING` order creation
- Kafka `ORDER_CREATED` publication
- Order not found
- Order ownership protection

Run:

```bash
cd services/order-service
npm test
```

### Portfolio Service

Current tests cover:

- Empty portfolio
- Duplicate completed event handling

Run:

```bash
cd services/portfolio-service
npm test
```

### API Gateway

Current tests cover:

- Missing authentication
- Invalid JWT
- Valid JWT
- Protected request rejection
- Authenticated request forwarding
- `x-user-id` propagation

Run:

```bash
cd services/api-gateway
npm test
```

Test execution evidence is included in:

```text
docs/Trend-Money-Postman-and-Test-Evidence.pdf
```

The evidence also contains application screenshots demonstrating authentication, products, orders, cancellation and portfolio behavior.


## 18. Logging and Error Handling

Services return meaningful HTTP errors without exposing sensitive information.

The API Gateway propagates known downstream HTTP errors and converts internal service connectivity failures into:

```text
502 Bad Gateway
```

Examples:

```text
Missing JWT
    ↓
401 Unauthorized

Invalid product
    ↓
400 Bad Request

Order belongs to another user
    ↓
403 Forbidden

Order/product not found
    ↓
404 Not Found

Duplicate email/product symbol
    ↓
409 Conflict

Internal service unavailable
    ↓
502 Bad Gateway
```

Unexpected database or server failures return:

```text
500 Internal Server Error
```

Sensitive values such as passwords and JWT secrets are not intended to be returned in API responses.


## 19. Retry Strategy

The core implementation does not use custom Kafka retry topics or a dead-letter queue.

Kafka client connectivity/reconnection behavior is used for Kafka communication.

Docker containers also use restart policies such as:

```yaml
restart: unless-stopped
```

Kafka retry topics and a dead-letter queue were intentionally not added because they are optional bonus features in the assignment.

This keeps the core implementation focused on the required functionality.


## 20. Environment Configuration

Secrets and environment-specific values are provided through `.env`.

The actual `.env` file should not be committed to GitHub.

The repository includes:

```text
.env.example
```

with the required configuration structure.

Example:

```env
JWT_SECRET=replace-with-a-random-secret

MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=change-this-password

AUTH_DB_NAME=auth_db
PRODUCT_DB_NAME=product_dbb
ORDER_DB_NAME=order_db
PORTFOLIO_DB_NAME=portfolio_db

MONGO_HOST=mongodb
MONGO_PORT=27017

API_GATEWAY_PORT=3000
FRONTEND_PORT=3006

KAFKA_INTERNAL_BROKER=kafka:9092
KAFKA_EXTERNAL_BROKER=localhost:9094
```

The reviewer should create a local `.env` from `.env.example` before starting the application.


## 21. Docker Setup

The complete application can be started using Docker Compose.

Docker Compose runs:

```text
MongoDB
Kafka
Auth Service
Product Service
Order Service
Portfolio Service
API Gateway
Next.js Frontend
```

Kafka and MongoDB do not need to be installed manually.

### Requirements

Install:

- Docker Desktop
- Git

### Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd trend-money-assignment
```

### Create environment file

Copy `.env.example` to `.env`.

Linux/macOS:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Update the secret values in `.env`.

### Start the application

```bash
docker compose up -d --build
```

### Check services

```bash
docker compose ps
```

The expected containers include:

```text
trend-money-mongodb
trend-money-kafka
trend-money-auth
trend-money-product
trend-money-order
trend-money-portfolio
trend-money-gateway
trend-money-frontend
```


## 22. Product Seeding

Products can be seeded using:

```bash
docker compose exec product-service node scripts/seed-products.js
```

After seeding, products can be accessed through the frontend or API Gateway.


## 23. Application URLs

Frontend:

```text
http://localhost:3006
```

API Gateway:

```text
http://localhost:3000
```

Swagger:

```text
http://localhost:3000/docs
```

MongoDB from the host:

```text
mongodb://admin:<your-password>@localhost:27017/?authSource=admin
```

Kafka external listener:

```text
localhost:9094
```

Internal Docker services communicate using Docker service names such as:

```text
mongodb
kafka
auth-service
product-service
order-service
portfolio-service
```


## 24. Frontend Architecture

The frontend is implemented using Next.js.

The browser communicates only with:

```text
http://localhost:3000
```

which is the API Gateway.

The frontend does not directly communicate with:

- Auth Service
- Product Service
- Order Service
- Portfolio Service
- MongoDB
- Kafka

The main frontend areas include:

```text
/login
/dashboard
/products
/products/:id
/orders
/orders/:id
/portfolio
```

The frontend provides:

- Registration
- Login
- Logout
- Dashboard
- Investment product listing
- Product search
- Product filtering
- Product pagination
- Product details
- Order creation
- Order status
- Order cancellation
- Order history
- Portfolio
- Holdings
- Loading states
- Error handling


## 25. Local Development

Each NestJS backend service is an independent Node.js project.

```text
services/
├── api-gateway/
├── auth-service/
├── product-service/
├── order-service/
└── portfolio-service/
```

The frontend is an independent Next.js project:

```text
frontend/
```

The root project is primarily used for:

- Docker Compose
- Environment configuration
- Documentation
- Project-level configuration

Individual services can be developed and tested independently.


## 26. Repository Structure

```text
trend-money-assignment/
│
├── .env
├── .env.example
├── .gitignore
├── docker-compose.yml
├── README.md
│
├── docs/
│   ├── architecture.dot
│   ├── architecture.png
│   └── Trend-Money-Postman-and-Test-Evidence.pdf
│
├── postman/
│   └── Trend-Money.postman_collection.json
│
├── frontend/
│
└── services/
    ├── api-gateway/
    ├── auth-service/
    ├── product-service/
    ├── order-service/
    └── portfolio-service/
```

The local `.env` file contains environment-specific secrets and should not be committed.


## 27. Production Considerations

This project is designed as a local assignment implementation rather than a production deployment.

For a production environment, the following improvements would be considered:

- TLS for external communication
- Kafka authentication and encryption
- Managed Kafka
- MongoDB replica sets or managed MongoDB
- Secret management through a dedicated secrets manager
- Container orchestration
- Horizontal service scaling
- API rate limiting
- Centralized logging
- Distributed tracing
- Correlation IDs
- Monitoring and alerting
- Kafka retry topics
- Dead-letter queues
- CI/CD
- End-to-end testing
- Health and readiness endpoints
- Automated backups


## 28. Trade-offs

### Single MongoDB Container

The local environment uses one MongoDB container with separate logical databases:

```text
auth_db
product_dbb
order_db
portfolio_db
```

This keeps local setup simple while maintaining database ownership boundaries between services.

A production deployment could use separate managed databases or stronger infrastructure isolation.

### Single Kafka Broker

The local environment uses a single Kafka broker.

This is appropriate for the assignment and keeps Docker setup simple.

A production system would normally use multiple Kafka brokers for availability and scalability.

### API Gateway Authentication

JWT validation is centralized at the API Gateway.

This avoids duplicating JWT validation logic across every domain service.

The gateway extracts `userId` from the validated JWT and forwards it through:

```text
x-user-id
```

### Event-Driven Order Processing

Order processing is asynchronous.

This separates order creation from the complete processing lifecycle and allows the Order Service to publish lifecycle events.

### Order Cancellation

A short asynchronous processing delay allows cancellation to be demonstrated while an order is in `PROCESSING`.

The service checks the latest database state before marking an order as completed, preventing a cancelled order from being completed afterward.

### No Roles

Role-based access control was not implemented because the assignment does not require admin/user roles.

### No Bonus Infrastructure

Redis caching, Kafka retry topics, dead-letter queues, WebSockets/SSE, distributed tracing, correlation IDs and CI/CD were not added because they are optional bonus features.

The implementation prioritizes the required microservices, Kafka, database-per-service, frontend, testing and Docker setup.


## 29. Test and Demo Evidence

The repository includes:

```text
docs/Trend-Money-Postman-and-Test-Evidence.pdf
```

The evidence contains screenshots of:

- Login
- Invalid credentials
- Registration
- Duplicate email handling
- Authenticated user information
- Product creation
- Product listing
- Product filtering
- Dashboard
- Product pagination
- Order processing
- Order cancellation
- Orders
- Portfolio
- Holdings
- Postman API testing
- Jest test execution

The recorded test evidence shows all five backend test suites passing.


## 30. Quick Start

The shortest way to run the complete project is:

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>

cd trend-money-assignment

cp .env.example .env

docker compose up -d --build

docker compose ps

docker compose exec product-service node scripts/seed-products.js
```

Then open:

```text
Frontend:
http://localhost:3006

Swagger:
http://localhost:3000/docs
```

The complete setup and architecture details are described throughout this README.


## 31. Submission Contents

The repository contains the required submission components:

- GitHub repository
- README
- Architecture diagram
- Swagger/OpenAPI documentation
- Postman collection
- Application screenshots and demo/test evidence
- `.env.example`
- Docker Compose setup

The complete project can be started locally using:

```bash
docker compose up -d --build
```

The reviewer does not need to install Kafka or MongoDB manually.