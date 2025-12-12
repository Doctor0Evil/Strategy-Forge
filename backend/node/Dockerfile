FROM node:22-alpine

WORKDIR /app

COPY package.json /app/
RUN npm install --only=production

COPY socket_gateway.js /app/

ENV ZMQ_ENDPOINT=tcp://php-api:5557
ENV SOCKET_PORT=8081

EXPOSE 8081

CMD ["node", "socket_gateway.js"]
