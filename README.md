# Momentum

Momentum is a full-stack weekly planning application for organizing events and personal information. It began as a Cal Poly web development course project and is now being developed into a polished portfolio project.

The application uses a TypeScript front end built with Vite and Web Components, an Express API, JWT-based authentication, and MongoDB persistence through Mongoose.

## Current status

The application currently supports account registration and login, editable user profiles, and authenticated weekly event data. Users can create, view, edit, and delete events, and classify them as one-time or recurring within the selected week. The earlier task workflow is being held outside the active interface until it has the same level of persistence and interaction. A public demo and visual project walkthrough will be added after the remaining portfolio-readiness work is complete.

## Technology

- TypeScript
- Vite
- Web Components
- Express
- MongoDB Atlas and Mongoose
- JSON Web Tokens and bcrypt
- npm workspaces

## Project structure

```text
packages/
  app/      TypeScript/Vite browser application
  server/   Express API, authentication, and MongoDB services
  proto/    Earlier static prototype retained for reference
```

## Local development

### Prerequisites

- Node.js 24.18.0 (the version is recorded in `.nvmrc`)
- npm 11 or newer
- A MongoDB Atlas database

If you use `nvm`, select the project's Node version before installing dependencies:

```bash
nvm use
```

Install all workspace dependencies from the repository root:

```bash
npm ci
```

Create the server environment file:

```bash
cp packages/server/.env.example packages/server/.env
```

Replace the placeholders in `packages/server/.env` with your MongoDB Atlas database-user credentials and a private token secret:

```dotenv
MONGO_USER=your_atlas_database_user
MONGO_PWD=your_atlas_database_password
MONGO_CLUSTER=your-cluster.example.mongodb.net
TOKEN_SECRET=your_private_token_secret
```

`MONGO_CLUSTER` should contain only the cluster hostname, without `mongodb+srv://`, credentials, a database path, or query parameters. The populated `.env` file is ignored by Git and must not be committed.

The server treats all four values as required and exits before opening its HTTP port if configuration or the Atlas connection is unavailable.

Start the API from one terminal:

```bash
npm run dev:server
```

Start the browser application from another terminal:

```bash
npm run dev:app
```

Open [http://localhost:5173](http://localhost:5173). Vite proxies `/api` and `/auth` requests to the Express server at `http://localhost:3000`.

## Available commands

Run these commands from the repository root:

| Command | Purpose |
| --- | --- |
| `npm run dev:app` | Start the Vite development server |
| `npm run dev:server` | Compile and restart the Express server when source files change |
| `npm run check` | Type-check the front end and server without emitting files |
| `npm run build` | Create production builds for the front end and server |
| `npm test` | Run fast server validation and configuration tests |
| `npm run test:integration` | Run the temporary-record Atlas integration test |

The integration test requires the configured `.env` file. It starts the API on a test port, exercises registration, profile ownership, and event persistence, then removes its uniquely named credential, profile, and event records.

## Deployment

The intended production arrangement is one Node web service that serves both the compiled Vite application and the Express API, backed by MongoDB Atlas. See the [deployment plan](docs/DEPLOYMENT.md) for the exact Render settings, environment variables, Atlas network configuration, and verification checklist.
