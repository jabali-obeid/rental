FROM node:20-slim

WORKDIR /app

# Install git and certificates required by some npm packages like Baileys
RUN apt-get update && apt-get install -y git ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package.json ./
RUN npm install --production

COPY . .

EXPOSE 3100
ENV PORT=3100

CMD ["node", "server.mjs"]
