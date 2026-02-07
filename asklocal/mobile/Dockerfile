# mobile/Dockerfile

# --- Stage 1: Build Flutter Web ---
FROM ghcr.io/cirruslabs/flutter:stable AS build

WORKDIR /app

# 1. Copy pubspec files first (better caching)
COPY pubspec.yaml pubspec.lock ./
RUN flutter pub get

# 2. Copy the rest of the source code
COPY . .

# 3. Build for Web
# We use --web-renderer html to ensure images load correctly (fixing the CORS issue)
# NOTE: web rendere has been not supported, suggest to use self object storage
RUN flutter build web --release 

# --- Stage 2: Serve with Nginx ---
FROM nginx:alpine

# Copy the built web files from the previous stage to Nginx
COPY --from=build /app/build/web /usr/share/nginx/html

# Expose port 80 (internal to container)
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]