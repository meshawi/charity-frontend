# Build stage
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Production stage – lightweight static server (no nginx)
FROM node:22-alpine

RUN npm install -g serve@latest

WORKDIR /app

COPY --from=build /app/dist ./dist

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
