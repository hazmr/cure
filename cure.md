# BACKEND SYSTEMS ENGINEERING
## Technical Assessment 2025

> **Objective:** Evaluate mastery over distributed system design, relational and non-relational database design, defensive API security practices, and horizontal scalability protocols.

---

## Project Brief

Engineer a high-throughput, mission-critical RESTful or gRPC API infrastructure backing CURE's scalable healthcare operations. The system must process concurrent scheduling transactions while guaranteeing transactional isolation.

---

## Core & Extended Requirements

### 🔐 Identity & Role-Based Access Control
Implement state-of-the-art authentication using JWT (Access & Refresh Tokens). Establish hierarchical roles: `Admin`, `Nurse`, and `Patient`.

### 🏥 Clinical Data Engine
Standardize sanitized CRUD operations for detailed medical histories, clinical notes, and patient files. Implement pagination and optimized filtering.

### 📅 Transactional Booking Engine
Build a highly cohesive workflow managing real-time clinical allocations, geographical constraints, and chronological status tracking.

---

## Security & Architectural Standards

### Architecture
Layered / Clean Architecture utilizing the Service Layer and Repository Patterns.

### Defensive Security
Mandatory hashing (bcrypt/Argon2id), rate-limiting, and strict payload validation (preventing SQLi/XSS).

### Audit Logging Ledger
Immutable transactional logs tracking all critical data alterations.

---

## Technology Stack & Bonus

| Category | Options |
|---|---|
| Frameworks | Node.js (NestJS/Express), Python (FastAPI), Go |
| Databases | PostgreSQL, MongoDB |
| Bonus | Docker Containerization, Swagger Docs, Redis Caching |

---

## Corporate Evaluation Philosophy

### 1. Engineering Mindset
Your technical choices must be deliberate and justified. Design architectures to treat components as interchangeable blocks, backed by comprehensive documentation.

### 2. Production Readiness
We evaluate code based on fitness for production. This requires thorough input validation, robust exception handling, and structural security.

### 3. Attention to Detail
This includes clean variable naming conventions, consistent formatting, comprehensive error messaging, and intuitive edge-case handling.

### 4. Code Delivery Protocol
We look for professional utilization of version control, semantic commit structures, and a polished presentation formatting layout for all deliverables.

---

## ⏰ Service Level Agreement (SLA)

> All core code, architecture blueprints, live links, and descriptive video demonstrations must be submitted within **72 Hours** from assignment delivery.

---

*CURE Engineering Internship 2025*