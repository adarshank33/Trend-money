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
- Docker and Docker Compose
- Jest unit testing
- Swagger/OpenAPI documentation


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
        │    auth_db     │ │   product_db   │ │    order_db    │
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
'''