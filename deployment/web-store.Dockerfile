# Rybella Web Store - Multi-stage build
# Stage 1: Build React app
FROM node:18-alpine AS builder

WORKDIR /app

COPY web-store/package*.json ./
RUN npm ci

COPY web-store/ ./

# Build with relative API URL (nginx will proxy /api to backend)
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Stage 2: Nginx with built app + reverse proxy
FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
COPY deployment/nginx-webstore.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
