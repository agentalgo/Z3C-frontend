FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN rm -f package-lock.json && npm install

COPY . .

ARG VITE_BASE_URL=http://localhost:5000/api/v1
ENV VITE_BASE_URL=${VITE_BASE_URL}

RUN npm run build:obfuscate

FROM nginx:1.27-alpine

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]