# game-api/Dockerfile
# (Use with workflow/build context = ./game-api)

# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Install deps (use lockfile if present)
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# Copy source and build
COPY tsconfig.json ./tsconfig.json
COPY src ./src
COPY public ./public
RUN npm run build

# Runtime stage
FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /app

# Copy build artifacts
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public

EXPOSE 3000

# Robust healthcheck without relying on wget/curl
HEALTHCHECK --interval=30s --timeout=5s --retries=5 \
  CMD node -e "require('http').get('http://127.0.0.1:3000/healthz',()=>process.exit(0)).on('error',()=>process.exit(1))"

CMD ["node", "dist/index.js"]
