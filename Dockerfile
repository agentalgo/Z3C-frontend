FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN rm -f package-lock.json && npm install

COPY . .

ARG VITE_BASE_URL=http://localhost:5000/api/v1
ENV VITE_BASE_URL=${VITE_BASE_URL}

RUN npm run build:obfuscate

FROM nginx:1.27-alpine

ENV CSP_CONNECT_SRC=http://10.192.100.50:5000

COPY nginx.conf.template /etc/nginx/default.conf.template
COPY docker-entrypoint.d/15-csp-envsubst.sh /docker-entrypoint.d/15-csp-envsubst.sh
RUN chmod +x /docker-entrypoint.d/15-csp-envsubst.sh
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]