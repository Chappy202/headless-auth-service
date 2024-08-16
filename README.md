# Headless Auth Service

A robust, scalable, and secure authentication service built with NestJS, Drizzle ORM, and Passport.js. This headless service provides a complete authentication and authorization solution that can be easily integrated with any frontend compatible with JWT.

## Features

- User authentication (username/email and password)
- JWT-based authentication
- Refresh token functionality
- Multi-Factor Authentication (MFA) support
- Password reset functionality
- Email verification
- User session tracking
- IP tracking for login history
- Role-Based Access Control (RBAC)
- Admin module for user management
- Token blacklisting for security
- Microservice-ready for easy integration with other APIs

## Tech Stack

- [NestJS](https://nestjs.com/) - A progressive Node.js framework for building efficient and scalable server-side applications.
- [Drizzle ORM](https://orm.drizzle.team/) - A lightweight and performant TypeScript ORM.
- [Passport](http://www.passportjs.org/) - Simple, unobtrusive authentication for Node.js.
- [PostgreSQL](https://www.postgresql.org/) - Open source object-relational database system.

## Project Structure

```
src/
├── common/
│ ├── decorators/
│ ├── dto/
│ ├── filters/
│ ├── guards/
│ └── utils/
├── infrastructure/
│ ├── cache/
│ └── database/
├── modules/
│ ├── admin/
│ ├── api-keys/
│ ├── auth/
│ ├── email/
│ ├── health/
│ ├── permissions/
│ ├── resources/
│ └── users/
├── app.module.ts
└── main.ts
```

## Installation and Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/headless-auth-service.git
cd headless-auth-service
```

2. Install dependencies:

```bash
yarn install
```

3. Set up environment variables:
   Create a `.env` file in the root directory and add the following variables:

   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/your_database
   JWT_SECRET=your_jwt_secret
   REFRESH_TOKEN_SECRET=your_refresh_token_secret
   JWT_EXPIRATION=2h
   JWT_REFRESH_EXPIRATION=7d
   VERIFICATION_TOKEN_EXPIRATION=24h
   PASSWORD_RESET_TOKEN_EXPIRATION=1h
   SALT_ROUNDS=10
   EMAIL_VERIFICATION_URL=http://localhost:3000/verify-email
   RESET_PASSWORD_URL=http://localhost:3000/reset-password
   FROM_EMAIL=noreply@youremail.com
   MFA_APP_NAME=YourAuthApp
   ```

4. Start docker containers:

```bash
docker compose up -d
```

5. Start the application:

```bash
yarn start:dev
```

## API Endpoints

### Authentication

- `POST /v1/auth/register` - Register a new user
- `POST /v1/auth/login` - Authenticate a user
- `POST /v1/auth/logout` - Logout (blacklist token)

### User Management

- `GET /v1/users/profile` - Get user profile
- `PUT /v1/users/profile` - Update user profile

### Admin

- `GET /v1/admin/users` - Get all users
- `POST /v1/admin/users` - Create a new user
- `GET /v1/admin/users/:id` - Get a user by id
- `PUT /v1/admin/users/:id` - Update a user
- `DELETE /v1/admin/users/:id` - Delete a user
- `POST /v1/admin/users/:userId/permissions/:permissionId` - Assign a permission to a user
- `GET /v1/admin/users/:userId/permissions` - Get user permissions
- `POST /v1/admin/resources` - Create a new resource
- `GET /v1/admin/resources` - Get all resources
- `POST /v1/admin/permissions` - Create a new permission
- `GET /v1/admin/permissions` - Get all permissions

### API Keys

- `POST /v1/api-keys` - Create a new API key
- `GET /v1/api-keys` - List all API keys
- `DELETE /v1/api-keys/:id` - Revoke an API key

### Permissions

- `POST /v1/permissions` - Create a new permission
- `GET /v1/permissions` - Get all permissions
- `GET /v1/permissions/:id` - Get a permission by id
- `POST /v1/permissions/assign-to-role/:permissionId/:roleId` - Assign a permission to a role
- `POST /v1/permissions/assign-to-user/:permissionId/:userId` - Assign a permission to a user

### Resources

- `POST /v1/resources` - Create a new resource
- `GET /v1/resources` - Get all resources
- `GET /v1/resources/:id` - Get a resource by id
- `GET /v1/resources/:id/permissions` - Get permissions for a resource

### Email

- `POST /v1/email/send` - Send an email

### Health Check

- `GET /v1/health` - Check the health of the application

## API Documentation

Detailed API documentation is available via Swagger UI. After starting the application, you can access the Swagger documentation at:

`http://localhost:3000/api`

This interactive documentation provides a comprehensive overview of all available endpoints, request/response schemas, and allows you to test the API directly from the browser.

### Available Endpoints

- Authentication: `/v1/auth`
- User Management: `/v1/users`
- Admin: `/v1/admin`
- API Keys: `/v1/api-keys`
- Permissions: `/v1/permissions`
- Resources: `/v1/resources`
- Email: `/v1/email`
- Health Check: `/v1/health`

### Swagger JSON

If you need the raw Swagger JSON for integration with other tools, you can access it at:

`http://localhost:3000/api-json`

### Authentication

The API uses JWT for authentication. Include the JWT token in the Authorization header of your requests:

```
Authorization: Bearer <your_jwt_token>
```

For endpoints that require specific permissions, make sure the authenticated user has the necessary roles or permissions assigned.

### Rate Limiting

The API implements rate limiting to prevent abuse. Please check the response headers for rate limit information:

- `X-RateLimit-Limit`: The maximum number of requests allowed in a time window
- `X-RateLimit-Remaining`: The number of requests remaining in the current time window
- `X-RateLimit-Reset`: The time at which the current rate limit window resets

### Versioning

The API is versioned. The current version is v1, which is reflected in the endpoint URLs (e.g., `/v1/auth/login`).

### Error Responses

The API uses standard HTTP response codes. In case of an error, you will receive a JSON response with an `error` field describing the issue.

Example:

```json
{
  "statusCode": 400,
  "message": "Bad Request",
  "error": "Invalid input data"
}
```

For the most up-to-date and detailed information about the API, always refer to the Swagger documentation.

## Roadmap

### Phase 1: Core Functionality and Security Enhancements

- [x] Implement consistent type safety and DTO definitions
- [x] Enhance API documentation
- [x] Implement consistent use of guards and decorators
- [x] Improve database security
- [ ] Refactor Admin module
- [ ] Enhance Users module
- [ ] Restructure Authentication module
- [ ] Implement logging system

### Phase 2: Advanced Authentication and Authorization

- [ ] Develop extensible authentication recipe system
  - [ ] Implement social login integrations (Google, GitHub, etc.)
  - [ ] Add support for passwordless authentication methods
  - [ ] Implement biometric authentication support
  - [ ] Create a plugin system for easily adding new authentication methods
- [ ] Enhance API Key system
  - [ ] Implement usage tracking and analytics for API keys
  - [ ] Add rate limiting and quota management for API keys
- [ ] Implement OAuth 2.0 provider functionality
- [ ] Advanced role and permission management
  - [ ] Implement hierarchical roles
  - [ ] Add support for custom permissions
  - [ ] Create tools for bulk permission management

### Phase 3: Multi-tenancy and Subscription Management

- [ ] Implement multi-tenancy support (optional feature)
  - [ ] Create company/organization management system
  - [ ] Develop user-company association functionality
  - [ ] Implement company-specific roles and permissions
- [ ] Add subscription and licensing features
  - [ ] Create subscription plan management system
  - [ ] Implement license generation and validation
  - [ ] Develop usage tracking and billing report generation
- [ ] Enhance admin functionality for multi-tenancy
- [ ] Implement user meta management

### Phase 4: Advanced Features and Scalability

- [ ] Implement feature toggle system
- [ ] Enhance metrics and tracking
- [ ] Improve scalability
  - [ ] Implement caching mechanisms
  - [ ] Optimize database queries and indexes
  - [ ] Implement a message queue for asynchronous tasks
- [ ] Develop advanced session management

### Phase 5: Microservice Architecture and Deployment Optimization

- [ ] Refactor modules for microservice deployment
- [ ] Optimize deployment process
  - [ ] Containerize all services using Docker
  - [ ] Create Kubernetes deployment configurations
  - [ ] Implement blue-green deployment strategy
- [ ] Enhance system observability
  - [ ] Implement distributed tracing
  - [ ] Create centralized logging and monitoring system
  - [ ] Develop health check and self-healing mechanisms

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
