# One image for every city. Which cities a container serves is decided by the
# configs mounted at $CITY_CONFIG_DIR (see deploy/k8s/city-app.yaml).
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN npm run build

FROM node:24-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
# Baked-in defaults; Kubernetes overrides them with a ConfigMap.
COPY config ./config
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
