const models = require("../../models");
const { loadReferences } = require("./productReferences");
const QuotationItem = require("../quotations/models/quotation-item.model");
const OrderItem = require("../orders/models/order-item.model");
const PoItem = require("../purchase-order/models/po-item.model");
const FgsItem = require("../purchase-order/models/fgs-item.model");

module.exports = async (req, res) => {
  try {
    const product = await models.Product.findByPk(req.params.productId);
    if (!product) return res.status(404).json({ message: "Product not found" });
    const references = await loadReferences(
      { ...models, QuotationItem, OrderItem, PoItem, FgsItem },
      req.params.productId,
    );
    res.json({ references });
  } catch (error) {
    console.error("Product references error:", error);
    res.status(500).json({ message: "Could not load product references" });
  }
};
