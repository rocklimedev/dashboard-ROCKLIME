const path = require("path");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const ftp = require("basic-ftp");
const { pipeline } = require("stream");
const { promisify } = require("util");
const pipe = promisify(pipeline);

const {
  Order,
  Customer,
  User,
  Team,
  Address,
  Quotation,
} = require("../models");
const { sendErrorResponse } = require("../utils/response.util");
const { bufferToStream } = require("../utils/ftp.util");
const { uploadToFtp } = require("../middleware/upload");
const { streamOrderSummaryPdf } = require("../services/pdf.service");
const { sendNotification } = require("./notificationController");
const logActivity = require("../utils/activityLogger");
const { ADMIN_USER_ID } = require("../config/constants");

// GET /api/orders/:id/download-invoice
exports.downloadInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id, {
      include: [{ model: Customer, as: "customer", attributes: ["name"] }],
      attributes: ["id", "orderNo", "invoiceLink"],
    });

    if (!order) {
      return sendErrorResponse(res, 404, "Order not found");
    }

    if (!order.invoiceLink) {
      return sendErrorResponse(res, 404, "No invoice attached to this order");
    }

    const invoiceUrl = order.invoiceLink; // Already full URL

    const response = await fetch(invoiceUrl);
    if (!response.ok) {
      return sendErrorResponse(
        res,
        502,
        "Unable to retrieve invoice from storage",
      );
    }

    const customerName = order.customer?.name || "Customer";
    const cleanName = customerName
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 30);
    const filename = `INVOICE #${order.orderNo} for ${cleanName}.pdf`;

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });

    await pipe(response.body, res);
  } catch (err) {
    return sendErrorResponse(res, 500, "Failed to download invoice");
  }
};

// GET /api/orders/:id/download  (renders a full PDF order summary)
exports.downloadOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id, {
      include: [
        { model: Customer, as: "customer", attributes: ["customerId", "name"] },
        {
          model: User,
          as: "creator",
          attributes: ["userId", "username", "name"],
        },
        {
          model: User,
          as: "assignedUser",
          attributes: ["userId", "username", "name"],
        },
        {
          model: User,
          as: "secondaryUser",
          attributes: ["userId", "username", "name"],
        },
        { model: Team, as: "assignedTeam", attributes: ["id", "teamName"] },
        { model: Order, as: "previousOrder", attributes: ["id", "orderNo"] },
        { model: Order, as: "masterOrder", attributes: ["id", "orderNo"] },
        { model: Order, as: "nextOrders", attributes: ["id", "orderNo"] },
        { model: Order, as: "pipelineOrders", attributes: ["id", "orderNo"] },
        { model: Address, as: "shippingAddress", attributes: ["addressId"] },
        {
          model: Quotation,
          as: "quotation",
          attributes: [
            "quotationId",
            "document_title",
            "quotation_date",
            "due_date",
            "followupDates",
            "reference_number",
            "products",
            "discountAmount",
            "roundOff",
            "finalAmount",
            "signature_name",
            "signature_image",
            "createdBy",
            "customerId",
            "shipTo",
          ],
        },
      ],
    });

    if (!order) {
      return sendErrorResponse(res, 404, "Order not found");
    }

    const data = order.toJSON();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Order-${data.orderNo}.pdf`,
    );

    streamOrderSummaryPdf(data, res);
  } catch (err) {
    return sendErrorResponse(
      res,
      500,
      "Failed to download order summary",
      err.message,
    );
  }
};

// Upload an invoice PDF and link it to an order
exports.uploadInvoiceAndLinkOrder = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { orderId } = req.params;
    const order = await Order.findByPk(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const ext = path.extname(req.file.originalname) || ".pdf";
    const uniqueName = `${uuidv4()}${ext}`;

    const client = new ftp.Client();
    client.ftp.verbose = process.env.NODE_ENV === "development";

    let fileUrl;
    try {
      await client.access({
        host: process.env.FTP_HOST,
        port: process.env.FTP_PORT || 21,
        user: process.env.FTP_USER,
        password: process.env.FTP_PASSWORD,
        secure: process.env.FTP_SECURE === "true",
      });

      const uploadDir = "/invoice_pdfs";
      await client.ensureDir(uploadDir);
      await client.cd(uploadDir);
      await client.uploadFrom(bufferToStream(req.file.buffer), uniqueName);
      await client.send(`SITE CHMOD 644 ${uniqueName}`);

      fileUrl = `https://media.cmtradingco.com${uploadDir}/${uniqueName}`;
    } catch (ftpErr) {
      return res
        .status(500)
        .json({ message: "FTP upload failed", error: ftpErr.message });
    } finally {
      client.close();
    }

    order.invoiceLink = fileUrl;
    await order.save();

    const customer = await Customer.findByPk(order.createdFor);

    await logActivity({
      userId: req.user?.userId || order.createdBy,
      contextTag: "SALES",
      subContext: "ORDER",
      action: "UPLOAD_INVOICE",
      entityId: order.id,
      entityName: order.orderNo,
      description: `Invoice uploaded for Order ${order.orderNo}`,
      metadata: {
        orderNo: order.orderNo,
        invoiceLink: fileUrl,
        fileName: uniqueName,
        fileSize: req.file.size,
        previousInvoice: order.invoiceLink || null,
        replaced: !!order.invoiceLink,
        customerName: customer?.name || null,
      },
      req,
    });

    const recipients = new Set(
      [order.createdBy, order.assignedUserId, order.secondaryUserId].filter(
        Boolean,
      ),
    );
    for (const uid of recipients) {
      await sendNotification({
        userId: uid,
        title: `Invoice Uploaded for Order #${order.orderNo}`,
        message: `An invoice has been uploaded for order #${order.orderNo} for ${customer?.name || "Customer"}.`,
      });
    }

    if (ADMIN_USER_ID) {
      await sendNotification({
        userId: ADMIN_USER_ID,
        title: `Invoice Uploaded for Order #${order.orderNo}`,
        message: `An invoice has been uploaded for order #${order.orderNo} for ${customer?.name || "Customer"}.`,
      });
    }

    return res.status(200).json({
      message: "Invoice uploaded successfully",
      filename: uniqueName,
      size: req.file.size,
      fileUrl,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

// Issue a gate-pass (required before an order can be DISPATCHED)
exports.issueGatePass = async (req, res) => {
  try {
    if (!req.file) {
      return sendErrorResponse(res, 400, "No file uploaded");
    }

    const { orderId } = req.params;
    const order = await Order.findByPk(orderId);
    if (!order) return sendErrorResponse(res, 404, "Order not found");

    const ext = path.extname(req.file.originalname) || ".pdf";
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;

    const fileUrl = await uploadToFtp(req.file.buffer, uniqueName, {
      remoteDir: "/invoice_pdfs",
      chmod: "644",
    });

    const previousGatePassLink = order.gatePassLink || null;
    await order.update({ gatePassLink: fileUrl });

    const customer = await Customer.findByPk(order.createdFor);

    await logActivity({
      userId: req.user?.userId || order.createdBy,
      contextTag: "SALES",
      subContext: "ORDER",
      action: "ISSUE_GATE_PASS",
      entityId: order.id,
      entityName: order.orderNo,
      description: `Gate-pass issued for Order ${order.orderNo}`,
      oldValues: { gatePassLink: previousGatePassLink },
      newValues: { gatePassLink: fileUrl },
      metadata: {
        orderNo: order.orderNo,
        customerName: customer?.name || null,
        fileUrl,
        fileName: uniqueName,
        fileSize: req.file?.size || null,
        replaced: !!previousGatePassLink,
      },
      req,
    });

    const recipients = new Set(
      [order.createdBy, order.assignedUserId, order.secondaryUserId].filter(
        Boolean,
      ),
    );

    for (const uid of recipients) {
      await sendNotification({
        userId: uid,
        title: `Gate-Pass Issued #${order.orderNo}`,
        message: `Gate-pass uploaded for order #${order.orderNo} – ${customer?.name || ""}.`,
      });
    }

    if (ADMIN_USER_ID) {
      await sendNotification({
        userId: ADMIN_USER_ID,
        title: `Gate-Pass Issued #${order.orderNo}`,
        message: `Gate-pass uploaded for order #${order.orderNo}.`,
      });
    }

    return res
      .status(200)
      .json({ message: "Gate-pass uploaded", gatePassLink: fileUrl });
  } catch (err) {
    return sendErrorResponse(res, 500, "Gate-pass upload failed", err.message);
  }
};

// GET /orders/:orderId/download?type=invoice|gatepass
exports.getDownloadDocument = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { type } = req.query;

    if (!["invoice", "gatepass"].includes(type)) {
      return res.status(400).json({ message: "Invalid type" });
    }

    const order = await Order.findByPk(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    let fileUrl;
    if (type === "invoice") fileUrl = order.invoiceLink;
    if (type === "gatepass") fileUrl = order.gatePassLink;

    if (!fileUrl) {
      return res.status(404).json({ message: `${type} not available` });
    }

    const filename = path.basename(fileUrl);

    const response = await axios.get(fileUrl, { responseType: "stream" });

    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader(
      "Content-Type",
      response.headers["content-type"] || "application/octet-stream",
    );

    response.data.pipe(res);
    response.data.on("end", () => res.end());
    response.data.on("error", (err) => {
      res.status(500).end();
    });
  } catch (err) {
    res.status(500).json({ message: "Download failed", error: err.message });
  }
};
