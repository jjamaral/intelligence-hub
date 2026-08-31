ARG BUILD_FROM=node:22.16.0-alpine
FROM ${BUILD_FROM}

ARG BUILD_VERSION=0.1.6
ARG BUILD_ARCH=amd64

LABEL io.hass.version="${BUILD_VERSION}" \
      io.hass.type="app" \
      io.hass.arch="${BUILD_ARCH}"

WORKDIR /app

RUN apk add --no-cache tzdata \
    && if ! command -v node >/dev/null 2>&1; then apk add --no-cache nodejs npm; fi

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json tsconfig.build.json ./
COPY src ./src

RUN npm run build \
    && npm prune --omit=dev \
    && rm -rf src tsconfig.json tsconfig.build.json

ENV NODE_ENV=production \
    INTELLIGENCE_HUB_OPTIONS=/data/options.json

EXPOSE 8099

CMD ["node", "dist/index.js"]
