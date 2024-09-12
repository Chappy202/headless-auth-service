# Contributing to Headless Auth Service

We're thrilled that you're interested in contributing to the Headless Auth Service! This document will guide you through the process of contributing to our project.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Workflow](#development-workflow)
3. [Commit Messages](#commit-messages)
4. [Pull Requests](#pull-requests)
5. [Code Style](#code-style)
6. [Testing](#testing)
7. [Documentation](#documentation)
8. [Versioning](#versioning)

## Getting Started

1. Fork the repository on GitHub.
2. Clone your forked repository to your local machine.
3. Install dependencies with `yarn install`.
4. Set up your environment variables as described in the README.md file.
5. Start the Docker containers with `docker compose up -d`.
6. Create a new branch for your feature or bug fix.

## Development Workflow

1. Make your changes in your feature branch.
2. Follow the coding standards and best practices outlined in this document.
3. Write or update tests as necessary.
4. Run tests with `yarn test` to ensure all tests pass.
5. Run the linter with `yarn lint` to check for any style issues.
6. Start the application with `yarn start:dev` and manually test your changes.

## Commit Messages

We use conventional commits to standardize our commit messages. This helps us generate meaningful changelogs and version numbers. Please format your commit messages as follows:
```
<type>(<scope>): <subject>
<body>
<footer>
```
Types include:

- feat: A new feature
- fix: A bug fix
- docs: Documentation only changes
- style: Changes that do not affect the meaning of the code (white-space, formatting, etc)
- refactor: A code change that neither fixes a bug nor adds a feature
- perf: A code change that improves performance
- test: Adding missing tests or correcting existing tests
- build: Changes that affect the build system or external dependencies
- ci: Changes to our CI configuration files and scripts
- chore: Other changes that don't modify src or test files

Example:
```
feat(auth): add support for API key authentication

This commit adds a new authentication method using API keys.

Closes #123
```

## Pull Requests

1. Update your feature branch with the latest changes from the main branch.
2. Push your branch to your fork on GitHub.
3. Open a pull request against the main repository.
4. Ensure the PR description clearly describes the problem and solution. Include the relevant issue number if applicable.
5. Request a review from one of the project maintainers.

## Code Style

- We use ESLint to enforce code style. Run yarn lint before committing.
- Write clear, readable, and well-documented code.
- Follow the principle of single responsibility for functions and classes.
- Use meaningful variable and function names.
- Ensure your code is type-safe and uses appropriate DTOs.

## Testing

- Write unit tests for new features and bug fixes.
- Ensure all tests pass before submitting a pull request.
- Aim for high test coverage, especially for critical components.
- Write integration tests for API endpoints.

## Documentation

- Update the README.md file if you're adding or changing functionality.
- Add JSDoc comments to functions and classes.
- Update API documentation using Swagger decorators if you're modifying endpoints.
- Keep the CHANGELOG.md file updated with significant changes.

## Versioning

We use Semantic Versioning (SemVer) for version numbers. The version will be automatically bumped based on your commit messages when a new release is created.

## Roadmap

Before starting work on a new feature, please check our roadmap in the README.md file. This will help ensure your contribution aligns with the project's goals and avoid duplicate efforts.
Thank you for contributing to the Headless Auth Service! Your efforts help make this project better for everyone.
