const express = require("express");
const fs = require("node:fs/promises");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const { auth } = require("../../middleware/auth");
const { Product, ProductMeta, sequelize } = require("../../models");
const { buildDuplicateReport } = require("./duplicate-report");
const router = express.Router();
const directory = path.resolve(
  process.env.OPERATIONS_STORAGE_DIR ||
    path.join(__dirname, "../../storage/operations"),
);
const services = [
  {
    id: "product-backup",
    name: "Product backup",
    description: "Export products and metadata definitions as a JSON snapshot.",
  },
  {
    id: "duplicate-scan",
    name: "Duplicate product scan",
    description:
      "Compare company codes and names; separate differing records for review.",
  },
];
let busy = false;
router.use(auth, (req, res, next) => {
  if (
    !req.user.roles.some((role) =>
      ["ADMIN", "SUPER_ADMIN", "DEVELOPER"].includes(role),
    )
  )
    return res
      .status(403)
      .json({ message: "Operations requires an administrator role." });
  next();
});
router.get("/", async (req, res, next) => {
  try {
    await fs.mkdir(directory, { recursive: true });
    const names = (await fs.readdir(directory)).filter((name) =>
      /^[0-9a-f-]{36}\.json$/.test(name),
    );
    const artifacts = await Promise.all(
      names.map(async (name) => {
        const stat = await fs.stat(path.join(directory, name));
        const data = JSON.parse(
          await fs.readFile(path.join(directory, name), "utf8"),
        );
        return {
          id: name.slice(0, -5),
          type: data.type,
          createdAt: data.createdAt,
          size: stat.size,
          summary: data.summary,
        };
      }),
    );
    res.json({
      services,
      busy,
      artifacts: artifacts.sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      ),
    });
  } catch (error) {
    next(error);
  }
});
router.post("/:service", async (req, res, next) => {
  if (!services.some((service) => service.id === req.params.service))
    return res.status(404).json({ message: "Unknown operation" });
  const threshold = req.body.threshold ?? 0.9;
  if (
    req.params.service === "duplicate-scan" &&
    (typeof threshold !== "number" ||
      !Number.isFinite(threshold) ||
      threshold < 0.9 ||
      threshold > 1)
  )
    return res
      .status(400)
      .json({ message: "Threshold must be between 0.9 and 1" });
  if (busy)
    return res
      .status(409)
      .json({
        message:
          "An operation is already running. Try again after it finishes.",
      });
  busy = true;
  try {
    const snapshot = await sequelize.transaction(
      { isolationLevel: "REPEATABLE READ" },
      async (transaction) => ({
        products: await Product.findAll({ raw: true, transaction }),
        productMetas: await ProductMeta.findAll({ raw: true, transaction }),
      }),
    );
    const id = randomUUID();
    const data = {
      type: req.params.service,
      createdAt: new Date().toISOString(),
      createdBy: req.user.userId,
      ...(req.params.service === "product-backup"
        ? {
            ...snapshot,
            summary: {
              products: snapshot.products.length,
              metadataDefinitions: snapshot.productMetas.length,
            },
          }
        : buildDuplicateReport(
            snapshot.products,
            snapshot.productMetas,
            threshold,
          )),
    };
    await fs.mkdir(directory, { recursive: true });
    const temporary = path.join(directory, `${id}.tmp`);
    await fs.writeFile(temporary, JSON.stringify(data, null, 2), {
      flag: "wx",
      mode: 0o600,
    });
    await fs.rename(temporary, path.join(directory, `${id}.json`));
    res
      .status(201)
      .json({
        id,
        type: data.type,
        createdAt: data.createdAt,
        summary: data.summary,
      });
  } catch (error) {
    next(error);
  } finally {
    busy = false;
  }
});
router.get("/artifacts/:id/:part?", async (req, res, next) => {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(
      req.params.id,
    )
  )
    return res.status(400).json({ message: "Invalid artifact ID" });
  try {
    const data = JSON.parse(
      await fs.readFile(path.join(directory, `${req.params.id}.json`), "utf8"),
    );
    const part = req.params.part;
    if (
      part &&
      (data.type !== "duplicate-scan" ||
        !["exact", "review", "skipped", "summary"].includes(part))
    )
      return res.status(400).json({ message: "Invalid report part" });
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${data.type}-${req.params.id}${part ? "-" + part : ""}.json"`,
    );
    res.json(part ? data[part] : data);
  } catch (error) {
    if (error.code === "ENOENT")
      return res.status(404).json({ message: "Artifact not found" });
    next(error);
  }
});
module.exports = router;
