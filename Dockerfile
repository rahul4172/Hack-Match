# Stage 1: Build the React frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend

COPY react-frontend/package*.json ./
RUN npm ci

COPY react-frontend/ ./
# We don't need a hardcoded URL for production since frontend will be served by backend
# BUT we should pass a dummy VITE_API_URL or it could be empty if they share the same origin
RUN npm run build

# Stage 2: Setup the Express backend and serve both
FROM node:20-alpine
WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --only=production

COPY backend/ ./

# Copy built frontend from Stage 1 into backend's public directory
COPY --from=frontend-build /app/frontend/dist ./public

# Expose backend port
EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000
# IMPORTANT: Provide defaults that can be overridden at runtime
ENV CORS_ORIGIN="*"

CMD ["node", "src/server.js"]
