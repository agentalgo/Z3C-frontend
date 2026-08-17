#!/bin/sh
set -e
# Official 20-envsubst only substitutes vars present in ENVIRON.
# Missing CSP_CONNECT_SRC leaves ${CSP_CONNECT_SRC} in the conf →
# nginx [emerg] unknown "csp_connect_src" variable.
# Substitute this var only so $uri stays an nginx variable.
export CSP_CONNECT_SRC="${CSP_CONNECT_SRC:-http://10.192.100.50:5000}"
envsubst '${CSP_CONNECT_SRC}' < /etc/nginx/default.conf.template > /etc/nginx/conf.d/default.conf
