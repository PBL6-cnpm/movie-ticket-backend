# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache python3 make g++ bash

RUN npm config set registry https://registry.npmmirror.com

COPY package.json yarn.lock ./

RUN yarn install --network-timeout 600000

COPY . .

RUN yarn build

FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache wget bash

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

RUN mkdir -p ./dist/src/common/templates \
    && cp -r ./dist/src/common/templates ./dist/src/common/templates || true

CMD ["yarn", "start:prod"]
