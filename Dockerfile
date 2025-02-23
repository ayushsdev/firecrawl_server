# Build stage
FROM node:20-slim AS builder
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm install

# Copy source files
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-slim AS production
WORKDIR /usr/src/app

# Create a non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --production

# Copy built files from builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Change ownership to non-root user
RUN chown -R appuser:appuser .

# Switch to non-root user
USER appuser

# Expose the port your app runs on
EXPOSE 3003

# Set Node.js to run in production mode
ENV NODE_ENV=production

# Start the server
CMD ["node", "dist/main.js"]