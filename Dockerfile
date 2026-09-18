# Build stage
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite inlines these into the bundle at build time, so they must be passed as
# build arguments (in Coolify: environment variables marked "Build Variable").
ARG VITE_API_URL
ARG VITE_BRAND_NAME
ARG VITE_BRAND_DESCRIPTION
ARG VITE_DEV_NAME
ARG VITE_DEV_URL

RUN npm run build

# Production stage – lightweight static server (no nginx)
FROM node:22-alpine

RUN npm install -g serve@latest

WORKDIR /app

COPY --from=build /app/dist ./dist

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
