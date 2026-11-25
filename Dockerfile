# One codebase, one image per city.
#   docker build --build-arg CITY=mumbai .   -> image contains only config/cities/mumbai.yaml
#   docker build .                           -> image contains every city
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN npm run build

FROM node:24-alpine
ARG CITY=""
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY config ./config
# Keep only the requested city's config, so the container can only ever serve that city.
RUN if [ -n "$CITY" ]; then \
      [ -f "config/cities/$CITY.yaml" ] || { echo "No config/cities/$CITY.yaml" >&2; exit 1; }; \
      find config/cities -type f ! -name "$CITY.yaml" -delete; \
    fi
LABEL org.opencontainers.image.city="${CITY:-all}"
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
