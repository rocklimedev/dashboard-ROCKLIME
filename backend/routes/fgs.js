// routes/fieldGuidedSheetRoutes.js

const express = require('express');
const router = express.Router();

const fieldGuidedSheetController = require('../controller/fgsController');

// Optional: Add middleware for authentication / authorization if needed
// const { authenticate, authorize } = require('../middleware/auth');
// router.use(authenticate);  // protect all routes
// or per-route: router.post('/', authorize('admin'), controller.create...)

// ─────────────────────────────────────────────────────────────
// CREATE - Create new Field Guided Sheet (FGS)
// POST /api/field-guided-sheets
// ─────────────────────────────────────────────────────────────
router.post('/', fieldGuidedSheetController.createFieldGuidedSheet);

// ─────────────────────────────────────────────────────────────
// READ - Get single FGS by ID
// GET /api/field-guided-sheets/:id
// ─────────────────────────────────────────────────────────────
router.get('/:id', fieldGuidedSheetController.getFieldGuidedSheetById);

// ─────────────────────────────────────────────────────────────
// READ - Get all FGS with pagination & filtering
// GET /api/field-guided-sheets
// Query params: ?page=1&limit=20
// ─────────────────────────────────────────────────────────────
router.get('/', fieldGuidedSheetController.getAllFieldGuidedSheets);

// ─────────────────────────────────────────────────────────────
// UPDATE - Update FGS (items, vendor, status, dates, etc.)
// PUT /api/field-guided-sheets/:id
// ─────────────────────────────────────────────────────────────
router.put('/:id', fieldGuidedSheetController.updateFieldGuidedSheet);

// ─────────────────────────────────────────────────────────────
// DELETE - Delete FGS (only if not converted)
// DELETE /api/field-guided-sheets/:id
// ─────────────────────────────────────────────────────────────
router.delete('/:id', fieldGuidedSheetController.deleteFieldGuidedSheet);

// ─────────────────────────────────────────────────────────────
// SPECIAL ACTIONS
// ─────────────────────────────────────────────────────────────

// Convert approved FGS → Purchase Order
// POST /api/field-guided-sheets/:id/convert
router.post('/:id/convert', fieldGuidedSheetController.convertFgsToPo);

// Update status only (draft → negotiating → approved → etc.)
// PATCH /api/field-guided-sheets/:id/status
router.patch('/:id/status', fieldGuidedSheetController.updateFieldGuidedSheetStatus);

// ─────────────────────────────────────────────────────────────
// Alternative names people sometimes prefer:
// ─────────────────────────────────────────────────────────────

// router.post('/:id/convert-to-po', fieldGuidedSheetController.convertFgsToPo);
// router.patch('/:id/change-status', fieldGuidedSheetController.updateFieldGuidedSheetStatus);

module.exports = router;