FROM node:20-alpine

WORKDIR /app

# Copy package.json dan lock file dulu biar kena caching Docker pas install library
COPY package*.json ./

RUN npm install

# Copy seluruh kodingan React
COPY . .

EXPOSE 5173

# Jalankan server development
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]