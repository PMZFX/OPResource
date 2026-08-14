FROM node:22-bookworm-slim@sha256:d649c27dae7ba0137b3cef5dd75baa422c08dc3d9e3fc0c23dfb172dc3cc6436

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY index.js resource_0.dat ./
COPY lang0000/ ./lang0000/

ENV PORT=1337
USER node
EXPOSE 1337

CMD ["node", "index.js"]
