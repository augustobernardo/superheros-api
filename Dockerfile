FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production && cp -R node_modules /tmp/node_modules_prod
RUN npm ci

COPY tsconfig*.json ./
COPY src/ ./src/
RUN npm run build

FROM node:22-alpine AS production

WORKDIR /app

RUN apk add --no-cache tini

COPY --from=build /app/dist ./dist
COPY --from=build /tmp/node_modules_prod ./node_modules
COPY package*.json ./

USER node

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main"]
