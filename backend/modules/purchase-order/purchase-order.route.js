// routes/purchaseOrderRoutes.js
const express = require('express');
const router = express.Router();
const purchaseOrderController = require('./purchase-order.controller');
const { auth } = require('../../middleware/auth');
const { guardModule } = require('../../middleware/permission');
router.use(auth);
router.use(guardModule('purchase_orders'));
// Create a new purchase order
router.post('/', purchaseOrderController.createPurchaseOrder);

// Get all purchase orders
router.get('/', purchaseOrderController.getAllPurchaseOrders);

// Get a purchase order by ID
router.get('/:id', purchaseOrderController.getPurchaseOrderById);

// Update a purchase order
router.put('/:id', purchaseOrderController.updatePurchaseOrder);

// Delete a purchase order
router.delete('/:id', purchaseOrderController.deletePurchaseOrder);

// Confirm a purchase order and update stock
router.put('/:id/confirm', purchaseOrderController.confirmPurchaseOrder);

// Get purchase orders by vendor
router.get('/vendor/:vendorId', purchaseOrderController.getPurchaseOrdersByVendor);
// ✅ New route to update purchase order status
router.patch('/:id/status', purchaseOrderController.updatePurchaseOrderStatus);
router.post('/:id/receive', purchaseOrderController.receivePurchaseOrder);
router.get('/:id/receipts', purchaseOrderController.getPurchaseOrderReceipts);
// A link the vendor can open without logging in (and a WhatsApp message with it)
router.post('/:id/share', async (req, res) => {
  try {
    const m = require('../../models');
    const po = await m.PurchaseOrder.findByPk(req.params.id);
    if (!po) return res.status(404).json({ message: 'Purchase order not found' });
    const vendor = await m.Vendor.findByPk(po.vendorId);
    const { signShare } = require('../../lib/shareToken');
    const base = (
      process.env.PUBLIC_BACKEND_URL || `http://localhost:${process.env.PORT || 5050}`
    ).replace(/\/+$/, '');
    const url = `${base}/api/public/po/${signShare({ t: 'po', id: po.id }, 90)}.pdf`;
    const company = await require('../settings/settings.service').getSetting('company');
    const text = `Dear ${vendor?.contactPerson || vendor?.vendorName || 'Sir'}, please find our purchase order ${po.poNumber} from ${company.brandName || company.name}: ${url}${po.expectDeliveryDate ? ` Kindly deliver by ${new Date(po.expectDeliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}.` : ''} Please confirm. Thank you.`;
    const phone = String(vendor?.phone || '')
      .replace(/\D/g, '')
      .slice(-10);
    res.json({
      url,
      message: text,
      whatsapp: `https://wa.me/${phone ? `91${phone}` : ''}?text=${encodeURIComponent(text)}`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// The purchase order PDF (Chhabra Marble format)
router.get('/:id/pdf', async (req, res) => {
  try {
    const { buildPoPdf } = require('./po-pdf');
    const { buffer, filename } = await buildPoPdf(
      req.params.id,
      req.query.exportOptions ? JSON.parse(req.query.exportOptions) : {},
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `${req.query.download ? 'attachment' : 'inline'}; filename="${filename}"`,
    );
    res.setHeader('Cache-Control', 'no-store');
    res.send(buffer);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Could not make the PDF' });
  }
});
module.exports = router;
