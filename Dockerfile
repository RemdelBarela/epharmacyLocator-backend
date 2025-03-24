# Use an official Node.js runtime as a parent image
FROM node:18

# Install OpenCV dependencies
RUN apt-get update && apt-get install -y libopencv-dev build-essential cmake python3

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first (to take advantage of Docker caching)
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the entire project into the container
COPY . .

# Expose the port that the app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
