FROM node:20-alpine

WORKDIR /usr/src/app

# Native build dependencies required by sqlite3 / node-gyp
RUN apk add --no-cache \
    python3 \
    make \
    g++

# 1. Copy package files FIRST
COPY package.json package-lock.json* ./

# 2. Install dependencies
RUN npm ci

# 3. Copy rest of app
COPY . .

EXPOSE 4000

CMD ["npm", "start"]