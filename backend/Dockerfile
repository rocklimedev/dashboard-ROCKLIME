FROM node:20-alpine

WORKDIR /usr/src/app

# 1. Copy package files FIRST
COPY package.json package-lock.json* ./

# 2. Install deps (this persists node_modules)
RUN npm ci --omit=dev

# 3. Copy rest of app
COPY . .

EXPOSE 4000
CMD ["npm", "start"]
