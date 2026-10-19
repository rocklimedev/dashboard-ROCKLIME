// Brand catalogues: upload real PDF catalogues, open them in the app and search
// inside them. The browser reads each page's text when the file is uploaded
// (pdf.js) and sends it along, so search works across all catalogues.
//
//   GET    /api/catalogues?search=&brandId=&category=      list
//   GET    /api/catalogues/search?q=&brandId=              page hits across catalogues
//   POST   /api/catalogues      multipart: file (PDF), cover (JPEG), title, brandId, category, year, pages (JSON [text…])
//   GET    /api/catalogues/:id  one catalogue
//   GET    /api/catalogues/:id/file    the PDF (supports Range for fast opening)
//   GET    /api/catalogues/:id/cover   the cover image
//   PUT    /api/catalogues/:id  { title, brandId, category, year }
//   POST   /api/catalogues/:id/text    { pages: [text…] }  (re-index)
//   DELETE /api/catalogues/:id
const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const axios = require("axios");
const cdn = require("./catalogue-storage");
const { randomUUID } = require("crypto");
const { QueryTypes } = require("sequelize");
const { auth } = require("../../middleware/auth");
const { guardModule } = require("../../middleware/permission");

const router = express.Router();
const DIR = path.resolve(process.env.CATALOGUE_DIR || path.join(__dirname, "../../storage/catalogues"));
const upload = multer({
  storage: cdn.storage,
  limits: { fileSize: 300 * 1024 * 1024, fieldSize: 60 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "file" && !/pdf$/i.test(file.mimetype) && !/\.pdf$/i.test(file.originalname)) return cb(Object.assign(new Error("Only PDF catalogues can be uploaded"), { status: 400 }));
    if (file.fieldname === "cover" && !/^image\/jpeg$/i.test(file.mimetype)) return cb(Object.assign(new Error("Catalogue covers must be JPEG images"), { status: 400 }));
    cb(null, true);
  },
});

const db = () => require("../../models").sequelize;
const q = (sql, r = {}) => db().query(sql, { replacements: r, type: QueryTypes.SELECT });
const fail = (res, err) => res.status(err.status || 500).json({ message: err.message || "Catalogue request failed" });
const clean = (v, n = 200) => (v == null || v === "" ? null : String(v).trim().slice(0, n));
const normText = (t) => String(t || "").replace(/\s+/g, " ").trim().slice(0, 200000);

const removeFile = name => cdn.isCdn(name) ? cdn.remove(name) : name ? fs.promises.unlink(path.join(DIR, path.basename(name))).catch(err => { if (err.code !== "ENOENT") throw err; }) : Promise.resolve();

// Serve PDFs through the authenticated endpoint without buffering or exposing
// the user's Authorization header to the CDN. Forward byte ranges for pdf.js.
async function sendCatalogueFile(req, res, name) {
  if (!cdn.isCdn(name)) return res.sendFile(path.join(DIR, path.basename(name)), { acceptRanges: true, maxAge: "1d" });
  const controller = new AbortController();
  const abort = () => controller.abort();
  res.on("close", abort);
  try {
    const upstream = await axios.get(cdn.cdnUrl(name), { responseType: "stream", signal: controller.signal,
      headers: req.headers.range ? { Range: req.headers.range } : {}, validateStatus: () => true });
    if (![200, 206, 304, 416].includes(upstream.status)) {
      upstream.data.destroy();
      return res.status(upstream.status === 404 ? 404 : 502).json({ message: "Catalogue file is unavailable on the CDN" });
    }
    res.status(upstream.status);
    for (const header of ["content-length", "content-range", "accept-ranges", "etag", "last-modified"]) {
      if (upstream.headers[header]) res.setHeader(header, upstream.headers[header]);
    }
    res.setHeader("Cache-Control", "private, max-age=86400");
    upstream.data.on("error", error => res.destroy(error));
    upstream.data.pipe(res);
  } catch (error) {
    if (!res.destroyed) throw error;
  }
}

// Covers are brand artwork shown in <img> tags, so they need no login (the id is a random UUID).
router.get("/:id/cover", async (req, res) => {
  try {
    const [row] = await q("SELECT coverName FROM catalogues WHERE id = ?", [req.params.id]);
    if (!row?.coverName) return res.status(404).end();
    res.set("Cross-Origin-Resource-Policy", "cross-origin");
    if (cdn.isCdn(row.coverName)) return res.redirect(cdn.cdnUrl(row.coverName));
    res.sendFile(path.join(DIR, path.basename(row.coverName)), { maxAge: "7d" });
  } catch (err) {
    fail(res, err);
  }
});

router.use(auth);
// reading needs "products" view; uploading/changing needs "products" edit
router.use(
  guardModule("products", [
    { method: "POST", path: /./, action: "edit" },
    { method: "PUT", path: /./, action: "edit" },
    { method: "DELETE", path: /./, action: "delete" },
  ]),
);

async function savePages(id, pages, transaction) {
  const list = Array.isArray(pages) ? pages : [];
  await db().query("DELETE FROM catalogue_pages WHERE catalogueId = ?", { replacements: [id], transaction });
  for (let i = 0; i < list.length; i += 200) {
    const chunk = list.slice(i, i + 200).map((t, k) => [id, i + k + 1, normText(t)]);
    if (!chunk.length) continue;
    await db().query(`INSERT INTO catalogue_pages (catalogueId, page, text) VALUES ${chunk.map(() => "(?,?,?)").join(",")}`, { replacements: chunk.flat(), transaction });
  }
  await db().query("UPDATE catalogues SET textIndexed = ?, updatedAt = NOW() WHERE id = ?", { replacements: [list.some((t) => normText(t)) ? 1 : 0, id], transaction });
}

const shape = (r) => ({ ...r, sizeBytes: Number(r.sizeBytes), pages: Number(r.pages), textIndexed: !!r.textIndexed, hasCover: !!r.coverName });

router.get("/", async (req, res) => {
  try {
    const where = ["1=1"];
    const r = {};
    if (req.query.search) {
      where.push("(c.title LIKE :s OR c.brandName LIKE :s OR c.category LIKE :s)");
      r.s = `%${String(req.query.search).trim()}%`;
    }
    if (req.query.brandId) {
      where.push("c.brandId = :b");
      r.b = req.query.brandId;
    }
    if (req.query.category) {
      where.push("c.category = :c");
      r.c = req.query.category;
    }
    const rows = await q(`SELECT c.* FROM catalogues c WHERE ${where.join(" AND ")} ORDER BY c.brandName ASC, c.title ASC`, r);
    const cats = await q("SELECT DISTINCT category FROM catalogues WHERE category IS NOT NULL ORDER BY category");
    res.json({ data: rows.map(shape), categories: cats.map((c) => c.category) });
  } catch (err) {
    fail(res, err);
  }
});

router.get("/search", async (req, res) => {
  try {
    const term = String(req.query.q || "").trim();
    if (term.length < 2) return res.json({ data: [] });
    const r = { s: `%${term}%`, t: term };
    let extra = "";
    if (req.query.brandId) {
      extra = "AND c.brandId = :b";
      r.b = req.query.brandId;
    }
    const rows = await q(
      `SELECT p.catalogueId, p.page, p.text, c.title, c.brandName
       FROM catalogue_pages p JOIN catalogues c ON c.id = p.catalogueId
       WHERE p.text LIKE :s ${extra}
       ORDER BY c.brandName, c.title, p.page LIMIT 200`,
      r,
    );
    const low = term.toLowerCase();
    res.json({
      data: rows.map((x) => {
        const txt = x.text || "";
        const at = txt.toLowerCase().indexOf(low);
        const from = Math.max(0, at - 60);
        return {
          catalogueId: x.catalogueId,
          title: x.title,
          brandName: x.brandName,
          page: Number(x.page),
          snippet: `${from > 0 ? "…" : ""}${txt.slice(from, at + term.length + 80)}${at + term.length + 80 < txt.length ? "…" : ""}`,
        };
      }),
    });
  } catch (err) {
    fail(res, err);
  }
});

router.post("/", upload.fields([{ name: "file", maxCount: 1 }, { name: "cover", maxCount: 1 }]), async (req, res) => {
  const file = req.files?.file?.[0];
  const cover = req.files?.cover?.[0];
  try {
    if (!file) throw Object.assign(new Error("Choose a PDF catalogue to upload"), { status: 400 });
    const id = randomUUID();
    let brandName = clean(req.body.brandName, 120);
    if (req.body.brandId) {
      const [b] = await q("SELECT brandName FROM brands WHERE id = ?", [req.body.brandId]).catch(() => []);
      brandName = b?.brandName || brandName;
    }
    const title = clean(req.body.title) || file.originalname.replace(/\.pdf$/i, "");
    const row = await db().transaction(async transaction => {
      await db().query(
        `INSERT INTO catalogues (id, title, brandId, brandName, category, year, fileName, storedName, coverName, sizeBytes, pages, uploadedBy, createdAt, updatedAt)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())`,
        {
          transaction,
          replacements: [
            id,
            title,
            clean(req.body.brandId, 36),
            brandName,
            clean(req.body.category, 120),
            clean(req.body.year, 20),
            file.originalname.slice(0, 255),
            file.filename,
            cover?.filename || null,
            file.size,
            Number(req.body.pageCount) || 0,
            req.user?.userId || null,
          ],
        },
      );
      let pages = [];
      try {
        pages = req.body.pages ? JSON.parse(req.body.pages) : [];
      } catch {
        pages = [];
      }
      if (pages.length) await savePages(id, pages, transaction);
      const [saved] = await db().query("SELECT * FROM catalogues WHERE id = ?", { replacements: [id], type: QueryTypes.SELECT, transaction });
      return saved;
    });
    res.status(201).json({ message: "Catalogue uploaded", catalogue: shape(row) });
  } catch (err) {
    for (const f of [file, cover]) if (f) await removeFile(f.filename).catch(cleanupError => console.error("Catalogue upload cleanup failed:", cleanupError.message));
    fail(res, err);
  }
});

const load = async (id) => {
  const [row] = await q("SELECT * FROM catalogues WHERE id = ?", [id]);
  if (!row) throw Object.assign(new Error("Catalogue not found"), { status: 404 });
  return row;
};

router.get("/:id", async (req, res) => {
  try {
    res.json({ catalogue: shape(await load(req.params.id)) });
  } catch (err) {
    fail(res, err);
  }
});

router.get("/:id/file", async (req, res) => {
  try {
    const row = await load(req.params.id);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(row.fileName)}"`);
    await sendCatalogueFile(req, res, row.storedName);
  } catch (err) {
    fail(res, err);
  }
});

router.put("/:id", async (req, res) => {
  try {
    await load(req.params.id);
    let brandName = clean(req.body.brandName, 120);
    if (req.body.brandId) {
      const [b] = await q("SELECT brandName FROM brands WHERE id = ?", [req.body.brandId]).catch(() => []);
      brandName = b?.brandName || brandName;
    }
    await db().query("UPDATE catalogues SET title = COALESCE(?, title), brandId = ?, brandName = ?, category = ?, year = ?, updatedAt = NOW() WHERE id = ?", {
      replacements: [clean(req.body.title), clean(req.body.brandId, 36), brandName, clean(req.body.category, 120), clean(req.body.year, 20), req.params.id],
    });
    res.json({ message: "Saved", catalogue: shape(await load(req.params.id)) });
  } catch (err) {
    fail(res, err);
  }
});

router.post("/:id/text", express.json({ limit: "60mb" }), async (req, res) => {
  try {
    await load(req.params.id);
    await savePages(req.params.id, req.body?.pages);
    if (req.body?.pageCount) await db().query("UPDATE catalogues SET pages = ? WHERE id = ?", { replacements: [Number(req.body.pageCount), req.params.id] });
    res.json({ message: "Search text saved" });
  } catch (err) {
    fail(res, err);
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const row = await load(req.params.id);
    await db().query("DELETE FROM catalogue_pages WHERE catalogueId = ?", { replacements: [row.id] });
    await db().query("DELETE FROM catalogues WHERE id = ?", { replacements: [row.id] });
    for (const n of [row.storedName, row.coverName]) if (n) await removeFile(n).catch(err => console.error("Catalogue delete cleanup failed:", err.message));
    res.json({ message: "Catalogue deleted" });
  } catch (err) {
    fail(res, err);
  }
});

router.use((err, req, res, next) => {
  if (err?.code === "LIMIT_FILE_SIZE") return res.status(413).json({ message: "The file is too large (300 MB at most)" });
  if (err) return fail(res, err);
  next();
});

module.exports = router;
