# Use official Node.js LTS image
FROM node:20-alpine

# Set working directory inside container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first (better caching)
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy rest of the app
COPY . .

# Expose port your app listens on
EXPOSE 3000

# Set environment variable for production
ENV NODE_ENV=production

# Start the app
CMD ["node", "index.js"]
