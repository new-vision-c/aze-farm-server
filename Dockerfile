# Étape 1: Build
FROM node:24-bookworm AS builder

# Installation de bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:$PATH"

WORKDIR /usr/src/app

COPY .env.example ./

# Install dependencies avec bun
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --ignore-scripts

# Copy source code
COPY tsconfig.json ./
COPY prisma ./prisma/
COPY src ./src/
COPY scripts ./scripts/
COPY docs/openapi.config.js ./docs/
COPY docs/openapi.yaml ./docs/

# Set up module aliases
RUN mkdir -p node_modules
RUN echo "{\"dependencies\":{\"@config\":\"file:./src/config\",\"@services\":\"file:./src/services\",\"@middlewares\":\"file:./src/middlewares\",\"@router\":\"file:./src/router\",\"@utils\":\"file:./src/utils\"}}" > node_modules/package.json

# Install Python YAML module for OpenAPI generation
RUN pip3 install PyYAML

# Generate OpenAPI and Prisma client
RUN bun run generate:openapi && bun run prisma:generate

# Build TypeScript
RUN bun run build

# Étape 2: Production
FROM node:24-bookworm AS production

# Installation de bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:$PATH"

WORKDIR /usr/src/app

ENV NODE_ENV=production

# Copy environment files
COPY --from=builder /usr/src/app/.env.example ./

# Copy docs directory (contient le openapi.yaml généré)
COPY --from=builder /usr/src/app/docs ./docs

# Set up module aliases in node_modules
COPY module-alias.config.js ./

# Install production dependencies only avec bun
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --ignore-scripts --production


# Copy build output and prisma schema
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma

# Copy JWT keys from source
COPY --from=builder /usr/src/app/src/config/keys ./src/config/keys

# Expose port (Render utilise le port 3000 par défaut)
EXPOSE 3000

# Health check pour Render
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["bun", "run", "start"]
