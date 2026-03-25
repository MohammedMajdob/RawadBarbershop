FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build
RUN ls -la dist/

EXPOSE 3002

CMD ["sh", "-c", "npx prisma migrate deploy --config prisma.config.ts && node dist/main"]
