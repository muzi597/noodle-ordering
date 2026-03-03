# Noodle Ordering

## Quickstart Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/muzi597/noodle-ordering.git
   cd noodle-ordering
   ```

2. Start the services using Docker Compose:
   ```bash
   docker-compose up
   ```

3. Access the API at `http://localhost:3000` and the KDS web app at `http://localhost:5173`.

## Local Development Steps

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the API:
   ```bash
   npm start --prefix apps/api
   ```
3. Run the KDS web app:
   ```bash
   npm start --prefix apps/kds-web
   ```

## Endpoints Summary

- **GET** `/orders`: Get a list of orders.
- **POST** `/orders`: Create an order.
- **GET** `/orders/:id`: Get a single order.

## Project Structure

```
noodle-ordering/
├── apps/
│   ├── api/             # NestJS API
│   └── kds-web/         # Vite React KDS app
├── docker-compose.yml    # Docker Compose configuration
├── .env.example          # Environment variables
├── package.json          # Root package.json
└── README.md             # Project documentation
```