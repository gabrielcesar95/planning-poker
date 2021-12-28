FROM node:14-alpine

WORKDIR /src

COPY . ./api

WORKDIR /src/api

RUN yarn install

EXPOSE 8080

CMD ["yarn", "start"]
