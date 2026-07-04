FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY core/ ./core/
COPY ui/ ./ui/
COPY ssh/ ./ssh/
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY assets/ ./assets/
COPY core/portfolio.yaml ./core/portfolio.yaml
EXPOSE 2222
CMD ["node", "dist/ssh/server.js"]
