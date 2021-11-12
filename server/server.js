const path = require("path");
require("dotenv").config();
const logger =
  process.env.NODE_ENV !== "production"
    ? true
    : {
        file: path.join(__dirname, "data/dataweek.log"),
        level: "info",
        sync: true,
      };
const fastify = require("fastify")({ logger });
const fastifyCors = require("fastify-cors");
const fastifyStatic = require("fastify-static");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const postEndpoints = [
  "gender",
  "hairColor",
  "hairCut",
  "mask",
  "shoe",
  "shoesColor",
  "top",
  "trouser",
];
const optPost = {
  schema: {
    params: {
      type: "object",
      properties: {
        category: { type: "string", enum: postEndpoints },
      },
    },
  },
};

fastify.post("/api/:category", optPost, async (request, reply) => {
  const { name } = request.body;
  const category = request.params.category;
  await prisma.category.upsert({
    where: { category_name: { category: category, name: name } },
    update: { count: { increment: 1 } },
    create: { category, name, count: 1 },
  });
  reply.send({ message: "Success" });
});

const getEndpoints = [
  "genders",
  "hairColors",
  "hairCuts",
  "masks",
  "shoes",
  "shoesColors",
  "tops",
  "trousers",
];
const optGet = {
  schema: {
    params: {
      type: "object",
      properties: {
        category: { type: "string", enum: getEndpoints },
      },
    },
  },
};

fastify.get("/api/:category", optGet, async (request, reply) => {
  const category = request.params.category.slice(0, -1);
  const res = await prisma.category.findMany({
    where: { category },
    select: { name: true, count: true },
    orderBy: { name: "asc" },
  });
  reply.send(res);
});

const start = async () => {
  try {
    await fastify.register(fastifyCors);
    fastify.register(fastifyStatic, {
      root: path.join(__dirname, "dist"),
      prefix: "/",
    });
    fastify.get("/", (request, reply) => {
      reply.sendFile("index.html");
    });
    fastify.listen(4448);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
