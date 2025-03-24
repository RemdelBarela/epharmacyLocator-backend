#!/bin/bash

# Update package lists
apt-get update

# Install dependencies for OpenCV
apt-get install -y build-essential cmake git pkg-config libgtk-3-dev \
    libavcodec-dev libavformat-dev libswscale-dev libv4l-dev libxvidcore-dev \
    libx264-dev libjpeg-dev libpng-dev libtiff-dev gfortran openexr \
    libatlas-base-dev python3-dev python3-numpy libtbb2 libtbb-dev libdc1394-22-dev

# Install OpenCV
apt-get install -y libopencv-dev
