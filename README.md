# HackMatch

HackMatch is a full-stack platform for finding hackathons, matching with teammates based on skills, and connecting with the developer community. It features a React frontend and a Node.js Express backend.

## Prerequisites

- **Node.js**: v20 or newer
- **Docker**: Optional, but recommended for easy full-stack deployment

## Local Development Setup

To run the project locally for development:

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd HackMatch
   ```

2. **Setup Environment Variables**
   ```bash
   cp backend/.env.example backend/.env
   cp react-frontend/.env.example react-frontend/.env
   ```
   *Edit the `.env` files and add any required secrets (e.g. `JWT_SECRET`).*

3. **Install Dependencies**
   Using the included Makefile makes it simple:
   ```bash
   make install
   ```

4. **Run the Development Servers**
   ```bash
   make dev
   ```

## Production Deployment

This project is fully containerized and ready for 1-click self-hosting.

### Using Docker Compose

```bash
docker compose up --build -d
```
This command builds the frontend, copies it to the backend, and serves the full application on port `5000`.

### Cloud Platforms

We include configuration files for popular platforms:
- **Railway**: `railway up` (Uses Dockerfile and `railway.json`)
- **Render**: Connect your GitHub repo and use the `render.yaml` blueprint.
- **Fly.io**: `fly deploy` (Uses `fly.toml`)
- **Vercel**: Deploy the frontend only using `vercel.json` and host backend separately.

## Environment Variable Reference

### Backend (`backend/.env`)

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `PORT` | Port for the Express server to listen on | `5000` |
| `NODE_ENV` | Environment type (`development` or `production`) | `production` |
| `CORS_ORIGIN` | Allowed origin for CORS (e.g., frontend URL) | `*` |
| `JWT_SECRET` | Secret key for signing JSON Web Tokens | (required) |

### Frontend (`react-frontend/.env`)

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `VITE_API_URL` | URL of the backend API | `http://localhost:5000` |
