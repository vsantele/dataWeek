FROM node:14-alpine

ENV NODE_ENV=production

RUN mkdir /app && chown -R node:node /app

WORKDIR /app
RUN mkdir data && chown -R node:node data

COPY package.json yarn.lock ./

RUN yarn install && yarn cache clean

COPY prisma prisma
RUN yarn prisma db push

COPY dist dist
COPY server.js server.js



ENTRYPOINT [ "yarn" ]

CMD ["start"]