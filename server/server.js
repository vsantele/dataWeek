import Prisma from "@prisma/client";
import dotenv from "dotenv";
import Fastify from "fastify";
import fastifyCors from "fastify-cors";
import fastifyStatic from "fastify-static";
import fs from "fs";
import { Liquid } from "liquidjs";
import path from "path";
import PointOfView from "point-of-view";
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

const engine = new Liquid({
  root: path.join(__dirname, "views"),
  extname: ".liquid",
  cache: process.env.NODE_ENV === "production",
});
fastify.register(PointOfView, {
  engine: {
    liquid: engine,
  },
});

const infos = JSON.parse(
  fs.readFileSync(path.join(__dirname, "data/categoryInfos.json"))
);

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
  "gender",
  "hairColor",
  "hairCut",
  "mask",
  "shoe",
  "shoesColor",
  "top",
  "trouser",
  "browser",
  "os",
  "deviceType",
  "deviceVendor",
  "deviceModel",
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
  const category = request.params.category;
  const res = await prisma.category.findMany({
    where: { category },
    select: { name: true, count: true },
    orderBy: { name: "asc" },
  });
  reply.send(res);
});

fastify.get("/charts/:category", optGet, async (request, reply) => {
  const category = request.params.category;
  const data = await prisma.category.findMany({
    where: { category },
    select: { name: true, count: true },
    orderBy: { name: "asc" },
  });
  const specials = [
    "browser",
    "os",
    "deviceType",
    "deviceVendor",
    "deviceModel",
  ];
  let info = {};
  if (specials.includes(category)) {
    info.choices = data.map((d) => ({
      code: d.name,
      name: d.name,
    }));
  } else {
    info = infos[category];
  }
  return reply.view("/views/chart.liquid", {
    category,
    name: info.name,
    infos: info.choices,
    data: JSON.stringify(data),
  });
});
fastify.get("/collectors/:category", optGet, async (request, reply) => {
  const category = request.params.category;
  return reply.view("/views/collector.liquid", {
    category,
    name: infos[category].name,
    infos: infos[category].choices,
  });
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
  await prisma.category.upsert({
    where: { category_name: { category, name: browser } },
    update: { count: { increment: 1 } },
    create: { category, name: browser, count: 1 },
  });
  category = "os";
  await prisma.category.upsert({
    where: { category_name: { category, name: os } },
    update: { count: { increment: 1 } },
    create: { category, name: os, count: 1 },
  });
  category = "deviceType";
  await prisma.category.upsert({
    where: { category_name: { category, name: deviceType } },
    update: { count: { increment: 1 } },
    create: { category, name: deviceType, count: 1 },
  });
  category = "deviceVendor";
  await prisma.category.upsert({
    where: { category_name: { category, name: deviceVendor } },
    update: { count: { increment: 1 } },
    create: { category, name: deviceVendor, count: 1 },
  });
  category = "deviceModel";
  await prisma.category.upsert({
    where: { category_name: { category, name: deviceModel } },
    update: { count: { increment: 1 } },
    create: { category, name: deviceModel, count: 1 },
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
