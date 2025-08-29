# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# Final stage
FROM nginx:alpine

# Install ca-certificates for HTTPS requests
RUN apk --no-cache add ca-certificates

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy the binary from builder stage
COPY --from=builder /app/main /root/main

# Create startup script
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'nginx &' >> /start.sh && \
    echo 'sleep 2' >> /start.sh && \
    echo 'cd /root && ./main' >> /start.sh && \
    chmod +x /start.sh

# Expose port
EXPOSE 80

# Command to run
CMD ["/start.sh"]
