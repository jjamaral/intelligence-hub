FROM node:22.16.0-alpine
ARG BUILD_VERSION=0.1.0
ARG BUILD_ARCH=amd64
LABEL io.hass.version="${BUILD_VERSION}" \
      io.hass.type="app" \
      io.hass.arch="${BUILD_ARCH}"
WORKDIR /app
COPY package.json tsconfig.json tsconfig.build.json ./
COPY types ./types
COPY src ./src
RUN npm install --global typescript@5.8.3 \
    && tsc -p tsconfig.build.json \
    && npm uninstall --global typescript \
    && rm -rf src types tsconfig.json tsconfig.build.json
ENV NODE_ENV=production \
    INTELLIGENCE_HUB_OPTIONS=/data/options.json
EXPOSE 8099
CMD ["node", "dist/src/index.js"]
