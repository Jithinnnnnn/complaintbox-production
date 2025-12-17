#!/bin/bash
set -e

echo "=== CUSTOM STARTUP SCRIPT RUNNING ==="

cd /home/site/wwwroot/server

npm install

node server.js
