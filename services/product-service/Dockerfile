FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig.json nest-cli.json ./
COPY src ./src
COPY scripts ./scripts

RUN npm run build

EXPOSE 3002

CMD ["npm", "run", "start:prod"]
