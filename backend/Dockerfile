FROM node:22-alpine

# Set work directory
WORKDIR /app

# Only copy package files first
COPY package*.json ./

# Install dependencies (production only)
RUN npm ci --only=production

# Copy rest of project
COPY . .

# Expose backend port
EXPOSE 4000

# Default command
CMD ["npm", "start"]
