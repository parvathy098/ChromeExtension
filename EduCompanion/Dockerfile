# Use Node.js base image
FROM node:18

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application to the working directory
COPY . .

# Expose port 3000 (make sure to match the port your app is using)
EXPOSE 3002

# Start the Node.js server
CMD ["npm", "start"]  
