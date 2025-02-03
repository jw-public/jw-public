# System Architecture & Patterns

## Project Structure
```
/src
├── client/           # Client-side code
│   ├── lib/         # Client libraries and utilities
│   ├── react/       # React components
│   └── templates/   # Template files
├── server/          # Server-side code
├── collections/     # MongoDB collections
├── imports/         # Shared modules
├── lib/            # Shared libraries
├── public/         # Static assets
└── tests/          # Test files
```

## Key Technical Decisions
1. Meteor Application Architecture
   - Full-stack JavaScript/TypeScript
   - MongoDB for data storage
   - DDP for real-time data sync

2. Frontend Architecture
   - React for UI components
   - Bootstrap for styling
   - TypeScript for type safety
   - Client-side templating

3. Infrastructure
   - Kubernetes deployment
   - Docker containerization
   - MongoDB database
   - Email service integration

## Architectural Patterns
1. Data Layer
   - MongoDB collections
   - Meteor pub/sub pattern
   - TypeScript interfaces for type safety

2. UI Layer
   - React component hierarchy
   - Bootstrap UI framework
   - LESS for styling

3. Backend Patterns
   - Meteor methods for API
   - Email notifications system
   - Logging infrastructure

## Development Patterns
1. Testing Strategy
   - Mocha for unit tests
   - Cypress for E2E tests
   - Coverage reporting

2. Build Process
   - TypeScript compilation
   - Meteor build system
   - Docker image creation

3. Deployment
   - Kubernetes orchestration
   - Environment-specific configs
   - Multiple deployment targets
