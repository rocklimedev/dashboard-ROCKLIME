const {
  Cart,
  Quotation,
  User,
  Product,
  getSellingPrice,
} = require("./cart.helpers");

// ✅ Convert Quotation to Cart - NO STOCK CHECK
exports.convertQuotationToCart = async (req, res) => {
  try {
    const { userId, quotationId } = req.body;

    if (!userId || !quotationId) {
      return res
        .status(400)
        .json({ message: "userId and quotationId are required" });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const quotation = await Quotation.findByPk(quotationId, {
      include: [{ model: Product, as: "items" }],
    });

    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    for (const item of quotation.items) {
      const product = await Product.findByPk(item.id);
      if (!product) {
        continue; // Skip if product no longer exists
      }

      // STOCK CHECK REMOVED

      const sellingPrice = getSellingPrice(product.meta);
      if (sellingPrice === null) {
        console.warn(`Skipping product ${item.id} due to invalid sellingPrice`);
        continue;
      }

      const existingItem = cart.items.find(
        (cartItem) => cartItem.productId.toString() === item.id.toString(),
      );

      if (existingItem) {
        existingItem.quantity += item.quantity;
        existingItem.total = existingItem.price * existingItem.quantity;
      } else {
        cart.items.push({
          productId: item.id,
          name: item.name,
          price: sellingPrice,
          quantity: item.quantity,
          discount: item.discount || 0,
          tax: item.tax || 0,
          total: sellingPrice * item.quantity,
        });
      }
    }

    await cart.save();
    res
      .status(200)
      .json({ message: "Quotation converted to cart successfully", cart });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Get Cart by User ID with Product Details
exports.getCartById = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(200).json({ cart: { items: [] } });
    }

    const updatedItems = await Promise.all(
      cart.items.map(async (item) => {
        const product = await Product.findByPk(item.productId);
        if (!product) {
          return null;
        }

        const sellingPrice = getSellingPrice(product.meta);
        if (sellingPrice === null) {
          console.warn(
            `Removing item ${item.productId} from cart due to invalid sellingPrice`,
          );
          return null;
        }

        return {
          productId: item.productId,
          name: product.name,
          price: sellingPrice,
          quantity: item.quantity,
          discount: item.discount || 0,
          tax: item.tax || 0,
          total: sellingPrice * item.quantity,
        };
      }),
    );

    cart.items = updatedItems.filter((item) => item !== null);
    await cart.save();

    res.status(200).json({ cart });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Get All Carts
exports.getAllCarts = async (req, res) => {
  try {
    const carts = await Cart.find();
    res.status(200).json({ success: true, carts });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
