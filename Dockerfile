FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install --production

# Copy the rest of your MVC code
COPY . .

EXPOSE 3001

CMD ["node", "server.js"]