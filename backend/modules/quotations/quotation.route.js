const express = require('express');
const router = express.Router();
const quotationDispatch = require('../orders/quotation-dispatch.controller');
const quotationController = require('./quotation.controller');
const { auth } = require('../../middleware/auth'); // Authentication middleware
const { guardModule } = require('../../middleware/permission');

router.use(auth);
router.use(
  guardModule('quotations', [
    { method: 'POST', path: /^\/export\//, action: 'view' },
    { method: 'PUT', path: /^\/[^/]+\/export-settings$/, action: 'view' },
    { method: 'POST', path: /^\/[^/]+\/share$/, action: 'view' },
    { method: 'POST', path: /^\/preview-pdf$/, action: 'view' },
    { method: 'POST', path: /^\/[^/]+\/restore\//, action: 'edit' },
    { method: 'POST', path: /^\/[^/]+\/followups$/, action: 'edit' },
  ]),
);
// ✅ Create a new quotation (Only Admins & Managers)
router.post('/add', auth, quotationController.createQuotation);

// Pipeline: counts per status, follow-ups due (before "/:id")
router.get('/pipeline/summary', quotationController.pipelineSummary);
router.post('/preview-pdf', quotationController.previewDraftPdf);

// ✅ Get all quotations (Admins, Managers & Sales Team)
router.get('/', quotationController.getAllQuotations);

router.get('/:id/export-settings', require('./quotation-settings.controller').handle);
router.put('/:id/export-settings', require('./quotation-settings.controller').handle);
router.get('/:id/dispatches', quotationDispatch.list);
router.post('/:id/dispatches', quotationDispatch.create);

// ✅ Get a single quotation by ID (Admins, Managers & Sales Team)
router.get(
  '/:id',

  quotationController.getQuotationById,
);

// ✅ edit a quotation by ID (Only Admins & Managers)
router.put('/:id', auth, quotationController.updateQuotation);

// ✅ Delete a quotation by ID (Only Admins)
router.delete('/:id', auth, quotationController.deleteQuotation);

// ✅ Export a quotation by ID (Admins, Managers & Sales Team)
router.post('/export/:id/:version?', auth, quotationController.exportQuotation);
router.post('/:id/clone', quotationController.cloneQuotation);

// New routes for versioning
router.get('/:id/versions/:version?', quotationController.getQuotationVersions);
router.get('/:id/pdf', quotationController.getQuotationPdf);
router.post('/:id/share', quotationController.createShareLink);
router.post('/:id/restore/:version', quotationController.restoreQuotationVersion);

router.patch('/:id/status', quotationController.updateStatus);
router.get('/:id/followups', quotationController.listFollowUps);
router.post('/:id/followups', quotationController.addFollowUp);

module.exports = router;
