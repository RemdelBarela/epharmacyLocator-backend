# Use a base image (choose based on your needs)
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Ensure package lists are updated before installation
RUN apt-get update && apt-get upgrade -y

# Install system dependencies for OpenCV
RUN apt-get install -y \
    python3 \
    python3-pip \
    build-essential \
    cmake \
    pkg-config \
    libgtk2.0-dev \
    libavcodec-dev \
    libavformat-dev \
    libswscale-dev \
    libtbb2 \
    libtbb-dev \
    libjpeg-dev \
    libpng-dev \
    libtiff-dev \
    libdc1394-22-dev \
    ffmpeg \
    libopencv-dev && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Set the environment variable to disable OpenCV auto-build
ENV OPENCV4NODEJS_DISABLE_AUTOBUILD=1

# Copy package.json and package-lock.json first (for better caching)
COPY package*.json ./

# Install dependencies
RUN npm install --unsafe-perm --force

# Copy the rest of the application files
COPY . .

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
