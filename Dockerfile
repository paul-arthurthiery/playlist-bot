FROM node:latest

RUN mkdir /app
ADD . /app
WORKDIR /app
RUN npm install
ENV NODE_ENV=production

CMD npm start