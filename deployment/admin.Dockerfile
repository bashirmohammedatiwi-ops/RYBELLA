# Rybella Admin Dashboard - Multi-stage build
# Stage 1: Build React app
FROM node:18-alpine AS builder

WORKDIR /app

COPY admin-dashboard/package*.json ./
RUN npm ci

COPY admin-dashboard/ ./

# Build with production API URL (relative path for nginx proxy)
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Stage 2: Nginx with built app + reverse proxy config
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy built React app
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config (from deployment folder, build context is project root)
COPY deployment/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
