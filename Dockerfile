# Use official Node.js image
FROM node:18

# Install OpenCV dependencies
RUN apt-get update && apt-get install -y \
    libopencv-dev \
    build-essential \
    cmake \
    python3 \
    python3-pip \
    pkg-config

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first for caching
COPY package.json package-lock.json ./

# Ensure correct Python version is used for node-gyp
ENV PYTHON python3

# Install dependencies
RUN npm install --unsafe-perm --force

# Copy the entire project into the container
COPY . .

# Expose port and start server
EXPOSE 3000
CMD ["npm", "start"]
