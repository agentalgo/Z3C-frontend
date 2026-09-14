#!/bin/sh
set -e
# Official 20-envsubst only substitutes vars present in ENVIRON.
# Missing CSP_CONNECT_SRC leaves ${CSP_CONNECT_SRC} in the conf →
# nginx [emerg] unknown "csp_connect_src" variable.
# Substitute this var only so $uri stays an nginx variable.
export CSP_CONNECT_SRC="${CSP_CONNECT_SRC:-http://localhost:5555}"
# Nest on the Docker host. Override with a compose service URL if the API
# shares a network with this container (e.g. http://zatca-backend:5555).
export API_UPSTREAM="${API_UPSTREAM:-http://host.docker.internal:5555}"
envsubst '${CSP_CONNECT_SRC} ${API_UPSTREAM}' < /etc/nginx/default.conf.template > /etc/nginx/conf.d/default.conf
