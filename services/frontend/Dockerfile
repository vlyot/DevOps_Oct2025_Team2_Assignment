# Stage 1: Build React app
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# --- Build Arguments (Must match your .env keys) ---
ARG VITE_API_URL=http://localhost:3000
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Set them as Environment Variables for Vite to pick up during 'npm run build'
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Build the application (Vite injects ENV variables into the /dist folder here)
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:1.25-alpine

# Copy the built production files from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy your custom nginx configuration
# (Ensure this file exists and handles React Router's 'try_files' correctly)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]