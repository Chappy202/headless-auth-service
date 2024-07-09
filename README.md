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

## Prerequisites

- Node.js (v14 or later)
- PostgreSQL
- npm or yarn

## Installation

1. Clone the repository:
`git clone https://github.com/yourusername/headless-auth-service.git`
`cd headless-auth-service`
2. Install dependencies:
`yarn install`
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
4. Start the application:
`yarn start:dev`

## API Endpoints

### Authentication

- `POST /auth/register` - Register a new user
- `POST /auth/login` - Authenticate a user
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout (blacklist token)
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password
- `POST /auth/verify-email` - Verify email address

### Multi-Factor Authentication

- `POST /auth/enable-mfa` - Enable MFA for a user
- `POST /auth/verify-mfa` - Verify and complete MFA setup
- `POST /auth/disable-mfa` - Disable MFA for a user

### User Management

- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update user profile

### Admin

- `POST /admin/users` - Create a new user
- `PUT /admin/users/:id` - Update a user
- `DELETE /admin/users/:id` - Delete a user
- `PUT /admin/users/:id/reset-password` - Reset user's password
- `PUT /admin/users/:id/disable-mfa` - Disable MFA for a user
- `GET /admin/users/:id/mfa-status` - Get MFA status for a user

## Security Features

- Passwords are hashed using bcrypt
- JWT tokens for stateless authentication
- Refresh token rotation
- Multi-Factor Authentication using TOTP
- IP tracking and suspicious activity monitoring
- Token blacklisting for logout and security purposes

## Integration with Other Services

This auth service is designed to work in a microservice architecture. Other services can verify JWTs and check permissions by using the provided middleware or by making API calls to this service.

## Testing

Run the test suite with:
`yarn test`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.