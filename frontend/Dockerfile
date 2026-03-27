# Use the official Node.js slim image (version 20 is a stable LTS)
FROM node:20-slim

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first (for caching best practices)
COPY package*.json ./

# Install frontend dependencies
RUN npm install

# Copy the rest of your frontend project code into the container
COPY . .

# Expose port 5173 for the Vite development server
EXPOSE 5173

# Run the Vite dev server and expose it to the Docker network (--host is required for Docker)
CMD ["npm", "run", "dev", "--", "--host"]
