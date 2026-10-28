const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const { Quotation } = require('../../models');
const Settings = sequelize.define('QuotationExportSettings', {
  quotationId: { type: DataTypes.UUID, allowNull: false },
  userId: { type: DataTypes.UUID, allowNull: false },
  version: { type: DataTypes.STRING(32), allowNull: false },
  settings: { type: DataTypes.JSON, allowNull: false },
}, { tableName: 'quotation_settings', indexes: [{ unique: true, fields: ['quotationId', 'userId', 'version'] }] });
const fields = new Set(['image', 'name', 'code', 'sno', 'qty', 'mrp', 'price', 'discount', 'total', 'roomTotals']);
exports.handle = async (req, res, next) => {
  try {
    const version = String(req.query.version || 'current');
    if (!/^(current|[1-9]\d{0,8})$/.test(version)) return res.status(400).json({ message: 'Invalid quotation version' });
    if (!await Quotation.findByPk(req.params.id)) return res.status(404).json({ message: 'Quotation not found' });
    const where = { quotationId: req.params.id, userId: req.user.userId, version };
    if (req.method === 'GET') {
      const row = await Settings.findOne({ where });
      return res.json({ settings: row?.settings || null });
    }
    const s = req.body;
    if (!s || !['detailed', 'compact'].includes(s.style) || typeof s.cover !== 'boolean' ||
      !Array.isArray(s.hidden) || s.hidden.some(k => !fields.has(k)) ||
      !(s.pageLabels === null || (Array.isArray(s.pageLabels) && s.pageLabels.length > 0 && s.pageLabels.length <= 5000 && s.pageLabels.every(k => typeof k === 'string' && k.length <= 1000)))) {
      return res.status(400).json({ message: 'Invalid export settings' });
    }
    await Settings.upsert({ ...where, settings: { style: s.style, cover: s.cover, hidden: [...new Set(s.hidden)], pageLabels: s.pageLabels } });
    return res.json({ message: 'Export settings saved' });
  } catch (error) { next(error); }
};
