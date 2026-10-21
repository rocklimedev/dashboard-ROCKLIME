const Cart = require("./models/carts.model");
const { transition } = require("./quotation-workspace");
const { savedTransition } = require("./saved-drafts");
const emptyWorkspace = () => ({ version: 2, revision: 0, activeId: null, drafts: [] });
async function load(userId, documentType = "quotation") {
  let cart = await Cart.findOne({ userId });
  if (!cart) cart = await Cart.create({ userId, items: [], quotationWorkspace: emptyWorkspace() });
  if (!cart.quotationWorkspace) {
    await Cart.updateOne({ _id: cart._id, quotationWorkspace: null }, { $set: { quotationWorkspace: emptyWorkspace() } });
    cart = await Cart.findById(cart._id);
  }
  return cart;
}
exports.get = async (req, res) => {
  try { const cart = await load(req.user.userId, req.query?.documentType || "quotation"); res.json({ workspace: cart.quotationWorkspace, cart }); }
  catch (error) { res.status(error.status || 500).json({ message: error.message }); }
};
exports.update = async (req, res) => {
  try {
    const cart = await load(req.user.userId);
    const current = cart.quotationWorkspace;
    if (req.body.activeId !== current.activeId || req.body.revision !== current.revision) return res.status(409).json({ message: "This quotation cart changed in another tab. Refresh before switching so your work is not overwritten." });
    const result = req.body.sessionMode ? savedTransition(current, req.body) : transition(current, req.body, cart.items);
    const saved = await Cart.findOneAndUpdate({ _id: cart._id, __v: cart.__v, "quotationWorkspace.activeId": current.activeId, "quotationWorkspace.revision": current.revision }, {
      $set: { quotationWorkspace: result.workspace, updatedAt: new Date(), ...(result.items ? { items: result.items } : {}) },
      $inc: { __v: 1 },
    }, { new: true, runValidators: true });
    if (!saved) return res.status(409).json({ message: "The quotation cart changed. Refresh and try again." });
    res.json({ workspace: saved.quotationWorkspace, cart: saved, savedDraftId: result.savedDraftId });
  } catch (error) { res.status(error.status || 500).json({ message: error.message }); }
};
