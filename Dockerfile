FROM node:latest

RUN mkdir /app
ADD . /app
WORKDIR /app
RUN npm install
ENV NODE=production

CMD npm start