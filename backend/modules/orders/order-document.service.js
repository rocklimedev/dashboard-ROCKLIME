require("dotenv").config();
const path = require("path");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const ftp = require("basic-ftp");
const { Readable } = require("stream");
const { uploadToFtp } = require("../../middleware/upload");
const { sendNotification } = require("../engagement/notification.controller");
const { pipeline } = require("stream");
const { promisify } = require("util");
const pipe = promisify(pipeline);
const PDFDocument = require("pdfkit");
const logActivity = require("../../utils/activityLogger");
const {
  User,
  Order,
  Team,
  Customer,
  Quotation,
  Address,
} = require("../../models");
const {
  sendErrorResponse,
  bufferToStream,
  ADMIN_USER_ID,
} = require("./services/orders.helpers");

// ──────────────────────────────────────────────────────────────
// Order document service — invoice/gate-pass upload & download,
// PDF order-summary generation. Extracted verbatim from the
// original monolithic order.controller.js.
// ──────────────────────────────────────────────────────────────

// GET /api/orders/:id/download-invoice
exports.downloadInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch only needed fields: orderNo, invoiceLink, and customer name
    const order = await Order.findByPk(id, {
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["name"],
        },
      ],
      attributes: ["id", "orderNo", "invoiceLink"],
    });

    if (!order) {
      return sendErrorResponse(res, 404, "Order not found");
    }

    if (!order.invoiceLink) {
      return sendErrorResponse(res, 404, "No invoice attached to this order");
    }

    // Optional: Authorization check (uncomment if needed)
    // const allowedUsers = [order.createdBy, order.assignedUserId, order.secondaryUserId].filter(Boolean);
    // if (!allowedUsers.includes(req.user.userId) && req.user.role !== 'admin') {
    //   return sendErrorResponse(res, 403, "Unauthorized to download invoice");
    // }

    const invoiceUrl = order.invoiceLink; // Already full URL — no need to modify

    // Fetch the PDF
    const response = await fetch(invoiceUrl);

    if (!response.ok) {
      return sendErrorResponse(
        res,
        502,
        "Unable to retrieve invoice from storage",
      );
    }

    // Generate clean, professional filename
    const customerName = order.customer?.name || "Customer";
    const cleanName = customerName
      .replace(/[^a-zA-Z0-9]/g, "_") // Replace special chars with _
      .substring(0, 30); // Limit length

    const filename = `INVOICE #${order.orderNo} for ${cleanName}.pdf`;

    // Set headers to force download with correct name
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });

    // Stream the file directly to client
    await pipe(response.body, res);
  } catch (err) {
    return sendErrorResponse(res, 500, "Failed to download invoice");
  }
};

exports.downloadOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id, {
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["customerId", "name"],
        },
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
        {
          model: Team,
          as: "assignedTeam",
          attributes: ["id", "teamName"],
        },
        {
          model: Order,
          as: "previousOrder",
          attributes: ["id", "orderNo"],
        },
        {
          model: Order,
          as: "masterOrder",
          attributes: ["id", "orderNo"],
        },
        {
          model: Order,
          as: "nextOrders",
          attributes: ["id", "orderNo"],
        },
        {
          model: Order,
          as: "pipelineOrders",
          attributes: ["id", "orderNo"],
        },
        {
          model: Address,
          as: "shippingAddress",
          attributes: ["addressId"],
        },
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

    const quotationProducts = data.quotation?.products || [];

    const products =
      data.products?.length > 0 ? data.products : quotationProducts;

    const doc = new PDFDocument({
      margin: 40,
      size: "A4",
    });

    res.setHeader("Content-Type", "application/pdf");

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Order-${data.orderNo}.pdf`,
    );

    doc.pipe(res);

    // ==========================
    // HEADER
    // ==========================

    doc.fontSize(22).text("ORDER SUMMARY", {
      align: "center",
    });

    doc.moveDown();

    doc.fontSize(11);

    doc.text(`Order No: ${data.orderNo}`);
    doc.text(`Quotation Ref: ${data.quotation?.reference_number || "-"}`);
    doc.text(`Status: ${data.status}`);
    doc.text(`Priority: ${data.priority}`);
    doc.text(`Created Date: ${new Date(data.createdAt).toLocaleDateString()}`);
    doc.text(
      `Due Date: ${
        data.dueDate ? new Date(data.dueDate).toLocaleDateString() : "-"
      }`,
    );

    doc.moveDown();

    // ==========================
    // CUSTOMER
    // ==========================

    doc.fontSize(16).text("Customer Details");

    doc.moveDown(0.5);

    doc.fontSize(11);

    doc.text(`Customer: ${data.customer?.name || "-"}`);

    doc.text(
      `Created By: ${data.creator?.name || data.creator?.username || "-"}`,
    );

    doc.text(
      `Assigned User: ${
        data.assignedUser?.name || data.assignedUser?.username || "-"
      }`,
    );

    doc.text(`Assigned Team: ${data.assignedTeam?.teamName || "-"}`);

    doc.moveDown();

    // ==========================
    // DESCRIPTION
    // ==========================

    doc.fontSize(16).text("Description");

    doc.moveDown(0.5);

    doc.fontSize(11).text(data.description || "-");

    doc.moveDown();

    // ==========================
    // PRODUCTS
    // ==========================

    doc.fontSize(16).text("Products");

    doc.moveDown();

    let y = doc.y;

    doc.fontSize(10);

    doc.text("#", 40, y);
    doc.text("Product", 70, y);
    doc.text("Qty", 320, y);
    doc.text("Price", 380, y);
    doc.text("Total", 470, y);

    y += 20;

    let grandTotal = 0;

    products.forEach((item, index) => {
      const total =
        Number(item.total) || Number(item.price) * Number(item.quantity);

      grandTotal += total;

      doc.text(index + 1, 40, y);

      doc.text(item.name || "-", 70, y, {
        width: 220,
      });

      doc.text(String(item.quantity || 0), 320, y);

      doc.text(`₹${Number(item.price || 0).toFixed(2)}`, 380, y);

      doc.text(`₹${total.toFixed(2)}`, 470, y);

      y += 25;

      if (y > 700) {
        doc.addPage();
        y = 50;
      }
    });

    doc.moveDown(3);

    // ==========================
    // FINANCIAL SUMMARY
    // ==========================

    doc.fontSize(16).text("Financial Summary");

    doc.moveDown();

    doc.fontSize(11);

    doc.text(`Product Total : ₹${grandTotal.toFixed(2)}`);

    doc.text(`Quotation Amount : ₹${data.quotation?.finalAmount || 0}`);

    doc.text(`Shipping : ₹${data.shipping || 0}`);

    doc.text(`GST : ₹${data.gstValue || 0}`);

    doc.text(`Extra Discount : ₹${data.extraDiscountValue || 0}`);

    doc.moveDown();

    const finalAmount =
      data.finalAmount && Number(data.finalAmount) > 0
        ? data.finalAmount
        : data.quotation?.finalAmount || 0;

    doc.fontSize(14).text(`Final Amount : ₹${finalAmount}`, {
      underline: true,
    });

    doc.text(`Amount Paid : ₹${data.amountPaid || 0}`);

    doc.moveDown(2);

    // ==========================
    // ORDER LINKS
    // ==========================

    doc.fontSize(16).text("Order Relations");

    doc.moveDown();

    doc.fontSize(11);

    doc.text(`Master Order : ${data.masterOrder?.orderNo || "-"}`);

    doc.text(`Previous Order : ${data.previousOrder?.orderNo || "-"}`);

    doc.text(
      `Next Orders : ${
        data.nextOrders?.length
          ? data.nextOrders.map((o) => o.orderNo).join(", ")
          : "-"
      }`,
    );

    doc.moveDown(2);

    // ==========================
    // FOOTER
    // ==========================

    doc
      .fontSize(10)
      .fillColor("gray")
      .text(`Generated on ${new Date().toLocaleString()}`, {
        align: "right",
      });

    doc.end();
  } catch (err) {
    return sendErrorResponse(
      res,
      500,
      "Failed to download order summary",
      err.message,
    );
  }
};

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
      await client.ensureDir(uploadDir); // string required
      await client.cd(uploadDir);

      await client.uploadFrom(bufferToStream(req.file.buffer), uniqueName);

      // Make file world-readable
      await client.send(`SITE CHMOD 644 ${uniqueName}`);

      fileUrl = `https://media.cmtradingco.com${uploadDir}/${uniqueName}`;
    } catch (ftpErr) {
      return res
        .status(500)
        .json({ message: "FTP upload failed", error: ftpErr.message });
    } finally {
      client.close();
    }

    // Update order
    order.invoiceLink = fileUrl;
    await order.save();
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
    const customer = await Customer.findByPk(order.createdFor);

    // Send notifications to relevant users
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

    // Notify admin
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

exports.issueGatePass = async (req, res) => {
  try {
    if (!req.file) {
      return sendErrorResponse(res, 400, "No file uploaded");
    }

    const { orderId } = req.params;
    const order = await Order.findByPk(orderId);
    if (!order) return sendErrorResponse(res, 404, "Order not found");

    // --- Generate unique filename ---
    const ext = path.extname(req.file.originalname) || ".pdf"; // fallback
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;

    // --- Upload to FTP ---
    const fileUrl = await uploadToFtp(req.file.buffer, uniqueName, {
      remoteDir: "/invoice_pdfs",
      chmod: "644",
    });

    // --- Update order record ---
    await order.update({ gatePassLink: fileUrl });
    await logActivity({
      userId: req.user?.userId || order.createdBy,
      contextTag: "SALES",
      subContext: "ORDER",
      action: "ISSUE_GATE_PASS",
      entityId: order.id,
      entityName: order.orderNo,
      description: `Gate-pass issued for Order ${order.orderNo}`,

      oldValues: {
        gatePassLink: order.gatePassLink || null,
      },

      newValues: {
        gatePassLink: fileUrl,
      },

      metadata: {
        orderNo: order.orderNo,
        customerName: customer?.name || null,
        fileUrl,
        fileName: uniqueName,
        fileSize: req.file?.size || null,
        replaced: !!order.gatePassLink,
      },

      req,
    });
    // --- Send notifications ---
    const customer = await Customer.findByPk(order.createdFor);
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

    // Notify admin
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
    const { type } = req.query; // "invoice" or "gatepass"

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

    // Extract filename
    const filename = path.basename(fileUrl);

    // Fetch file from URL and pipe it to response
    const response = await axios.get(fileUrl, {
      responseType: "stream",
    });

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
