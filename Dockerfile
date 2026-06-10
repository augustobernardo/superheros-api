FROM node:22-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production && cp -R node_modules /tmp/node_modules_prod

FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig*.json ./
COPY src/ ./src/
RUN npm run build

FROM node:22-alpine AS production

WORKDIR /app

RUN apk add --no-cache tini

COPY --from=deps /tmp/node_modules_prod ./node_modules
COPY --from=build /app/dist ./dist
COPY package*.json ./
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER node

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--", "docker-entrypoint.sh"]
CMD ["node", "dist/main"]
