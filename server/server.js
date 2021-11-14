import Prisma from "@prisma/client";
import dotenv from "dotenv";
import Fastify from "fastify";
import fastifyCors from "fastify-cors";
import fastifyStatic from "fastify-static";
import path from "path";
import UAParser from "ua-parser-js";
dotenv.config();
const __dirname = path.resolve();
const logger =
  process.env.NODE_ENV !== "production"
    ? { prettyPrint: true }
    : {
        file: path.join(__dirname, "data/dataweek.log"),
        level: "info",
        sync: true,
      };

const fastify = Fastify({ logger });
const { PrismaClient } = Prisma;
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

fastify.get("/quizz", async (request, reply) => {
  const ua = UAParser(request.headers["user-agent"]);
  // reply.send({ ua });
  reply.redirect(303, process.env.QUIZZ_URL);
  const browser = ua.browser?.name ?? "other";
  const os = ua.os?.name ?? "other";
  const deviceType = ua.device?.type ?? "other";
  const deviceVendor = ua.device?.vendor ?? "other";
  const deviceModel = ua.device?.model ?? "other";
  let category = "browser";
  prisma.category.upsert({
    where: { category_name: { category, name: browser } },
    update: { count: { increment: 1 } },
    create: { category, name: browser, count: 1 },
  });
  category = "os";
  prisma.category.upsert({
    where: { category_name: { category, name: os } },
    update: { count: { increment: 1 } },
    create: { category, name: browser, count: 1 },
  });
  category = "deviceType";
  prisma.category.upsert({
    where: { category_name: { category, name: deviceType } },
    update: { count: { increment: 1 } },
    create: { category, name: browser, count: 1 },
  });
  category = "deviceVendor";
  prisma.category.upsert({
    where: { category_name: { category, name: deviceVendor } },
    update: { count: { increment: 1 } },
    create: { category, name: browser, count: 1 },
  });
  category = "deviceModel";
  prisma.category.upsert({
    where: { category_name: { category, name: deviceModel } },
    update: { count: { increment: 1 } },
    create: { category, name: browser, count: 1 },
  });
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
    fastify.listen(4448, "0.0.0.0");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
