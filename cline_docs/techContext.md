# Technical Context

## Core Technologies
- Meteor (full-stack JavaScript framework)
- TypeScript (programming language)
- React 15.7.0 (frontend framework, notably outdated)
- MongoDB (implied by Meteor)

## Frontend Technologies
- Bootstrap 5.0.0
- jQuery 2.2.4 (outdated)
- Various React addons (all v15.x - outdated)
- Moment.js for date handling
- i18n for internationalization

## Development Setup
- TypeScript compilation with watch mode available
- Meteor development server
- Comprehensive testing setup:
  - Mocha for unit testing
  - Cypress for E2E testing
  - Istanbul for code coverage

## Technical Constraints
1. Legacy Dependencies:
   - React 15.x (very old, current is 18.x)
   - jQuery 2.x (very old, current is 3.x)
   - Old React patterns and addons

2. Infrastructure:
   - Kubernetes deployment ready
   - MongoDB database requirement
   - Email service integration needed

3. Testing Requirements:
   - Unit tests with Mocha
   - E2E tests with Cypress
   - Coverage reporting

## Migration Plans
- Project identified as outdated beyond refactoring
- Complete rewrite planned with modern stack:
  - Next.js with App Router
  - TypeScript
  - Mantine UI framework
  - Drizzle ORM
  - PostgreSQL (replacing MongoDB)
  - next-intl for internationalization
  - NextAuth.js for authentication

## Database Migration
1. Current: MongoDB (document-based)
   - Flexible schema
   - Nested document structures
   - No enforced relations

2. Target: PostgreSQL + Drizzle
   - Strong data consistency
   - Enforced relations
   - Type safety with TypeScript
   - Transaction support
   - Better query performance for relational data

## UI Migration
1. Current: React 15 + jQuery + Bootstrap
   - Outdated React patterns
   - Mixed UI libraries
   - Legacy component lifecycle

2. Target: Next.js + Mantine
   - Modern React patterns
   - Server Components
   - Consistent UI framework
   - Built-in TypeScript support
   - Improved performance
   - Better maintainability
