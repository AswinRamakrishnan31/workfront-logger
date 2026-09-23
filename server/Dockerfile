FROM node:20-alpine

# Install OpenSSL for Prisma
RUN apk add --no-libc-musl openssl

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

EXPOSE 3001

CMD ["node", "src/index.js"]
