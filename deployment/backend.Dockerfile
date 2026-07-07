# Rybella Backend - Node.js API
FROM node:18-alpine

# wget: healthcheck | postgresql-client: scripts | vips: sharp image processing
RUN apk add --no-cache wget unzip postgresql16-client vips

WORKDIR /app

# Copy backend (includes database/schema.sql) and project database seed
COPY backend/ ./
COPY database/ /database/

# Install production dependencies only
RUN npm ci --omit=dev

# Ensure sharp native bindings load on Alpine (image resize / WebP cache)
RUN node -e "const s=require('sharp'); console.log('sharp ok', s.versions)" \
  || (npm rebuild sharp && node -e "require('sharp')")

# Create uploads, data, and backups directories
RUN mkdir -p uploads database data backups

# Backend runs on port 4000 (avoid conflict with port 3000)
ENV PORT=4000
ENV NODE_ENV=production

EXPOSE 4000

CMD ["node", "server.js"]
