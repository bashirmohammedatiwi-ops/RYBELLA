# Rybella Backend - Node.js API
FROM node:18-alpine

RUN apk add --no-cache wget

WORKDIR /app

# Copy backend (includes database/schema.sql) and project database seed
COPY backend/ ./
COPY database/ /database/

# Install production dependencies only
RUN npm ci --omit=dev

# Create uploads and data directories
RUN mkdir -p uploads database data

# Backend runs on port 4000 (avoid conflict with port 3000)
ENV PORT=4000
ENV NODE_ENV=production

EXPOSE 4000

CMD ["node", "server.js"]
