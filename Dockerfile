FROM node:22-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

ENV NODE_ENV=production
ENV HABIT_DB_PATH=/app/data/habits.db

RUN mkdir -p /app/data

EXPOSE 3000

CMD ["npm", "run", "start"]
