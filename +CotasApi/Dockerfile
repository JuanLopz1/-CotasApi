FROM node:22-alpine AS build-stage
WORKDIR /app

COPY package*.json ./
COPY frontend/package*.json ./frontend/

RUN npm install
RUN npm install --prefix frontend

COPY . .

RUN npm run build

FROM nginx:stable-alpine AS production-stage
COPY --from=build-stage /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]