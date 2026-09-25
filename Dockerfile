FROM node:22-bookworm-slim

WORKDIR /app

# Install dependencies. The source tree is intentionally retained because
# Railway's pre-deploy migration command runs against the same image.
COPY package.json bun.lock ./
RUN npm install --no-audit --no-fund

COPY . .

RUN npm run build

ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "run", "start"]
