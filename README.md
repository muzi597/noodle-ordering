# Noodle Ordering

This repository is set up as a monorepo using pnpm workspaces for a food ordering system.

## Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/muzi597/noodle-ordering.git
   cd noodle-ordering
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Environment variables**: Create a `.env` file based on `.env.example`.

4. **Start the applications**:
   ```bash
   pnpm dev
   ```

## Environment Variables

- `DATABASE_URL`: Connection string for PostgreSQL database.
- `WEBSOCKET_URL`: URL for WebSocket connection.

## Available Scripts

- `pnpm db:push`: Push database schema to PostgreSQL.
- `pnpm db:seed`: Seed the database with initial data.
