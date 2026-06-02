# Build stage
FROM node:20-slim AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci --silent

COPY . .

ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

RUN npm run build

# Serve stage
FROM nginx:1.27-alpine

COPY --from=build /app/build /usr/share/nginx/html

# SPA routing support
RUN echo 'server { \
  listen 80; \
  root /usr/share/nginx/html; \
  index index.html; \
  location / { try_files $uri $uri/ /index.html; } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
