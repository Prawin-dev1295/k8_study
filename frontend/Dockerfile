FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
ENV API_BASE_URL=/api
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
RUN printf '#!/bin/sh\nset -eu\ncat > /usr/share/nginx/html/config.js <<EOF\nwindow.__APP_CONFIG__ = { API_BASE_URL: "${API_BASE_URL}" };\nEOF\n' > /docker-entrypoint.d/40-runtime-config.sh \
  && chmod +x /docker-entrypoint.d/40-runtime-config.sh
EXPOSE 80
