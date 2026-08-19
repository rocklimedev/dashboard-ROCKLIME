const { Cart, User, Product, getSellingPrice } = require("./cart.helpers");

// ──────────────────────────────────────────────────────
// Add Single Product to Cart - NO STOCK CHECK
// ──────────────────────────────────────────────────────
exports.addProductToCart = async (req, res) => {
  try {
    const { userId, productId, quantity = 1 } = req.body;

    if (!userId || !productId || !Number.isInteger(quantity) || quantity < 1) {
      return res
        .status(400)
        .json({ message: "userId, productId and valid quantity required" });
    }

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const product = await Product.findOne({ where: { productId } });
    if (!product)
      return res
        .status(404)
        .json({ message: `Product not found: ${productId}` });

    const sellingPrice = getSellingPrice(product.meta);
    if (!sellingPrice) {
      return res.status(400).json({
        message: `Invalid or missing sellingPrice for product: ${productId}`,
      });
    }

    // STOCK CHECK REMOVED - Allow adding even if out of stock

    let cart = await Cart.findOne({ userId });
    if (!cart) cart = new Cart({ userId, items: [] });

    const existingItem = cart.items.find(
      (i) => i.productId.toString() === productId.toString(),
    );

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.total = existingItem.price * existingItem.quantity;
    } else {
      cart.items.push({
        productId,
        name: product.name,
        price: sellingPrice,
        quantity,
        discount: 0,
        tax: product.tax || 0,
        total: sellingPrice * quantity,
      });
    }

    await cart.save();

    const message =
      product.quantity < quantity
        ? "Product added to cart (even though stock is insufficient)"
        : "Product added to cart";

    res.status(200).json({ message, cart });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ──────────────────────────────────────────────────────
// Bulk Add to Cart - NO STOCK CHECK
// ──────────────────────────────────────────────────────
exports.addToCart = async (req, res) => {
  try {
    const { userId, items, customerId } = req.body;

    if (!userId || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ message: "userId and items array required" });
    }

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    let cart = await Cart.findOne({ userId, customerId: customerId || null });
    if (!cart)
      cart = new Cart({ userId, customerId: customerId || null, items: [] });

    for (const item of items) {
      const { productId, quantity, discount = 0, tax = 0 } = item;
      const qty = Number(quantity);

      if (!productId || isNaN(qty) || qty < 1) {
        return res.status(400).json({ message: "Invalid item data" });
      }

      const product = await Product.findOne({ where: { productId } });
      if (!product)
        return res
          .status(404)
          .json({ message: `Product not found: ${productId}` });

      const sellingPrice = getSellingPrice(product.meta);
      if (!sellingPrice) {
        return res
          .status(400)
          .json({ message: `Invalid sellingPrice for product: ${productId}` });
      }

      // STOCK CHECK REMOVED - Allow adding even if out of stock

      const existing = cart.items.find(
        (i) => i.productId.toString() === productId.toString(),
      );

      if (existing) {
        existing.quantity += qty;
        existing.total = existing.price * existing.quantity;
      } else {
        cart.items.push({
          productId,
          name: product.name,
          price: sellingPrice,
          quantity: qty,
          discount: Number(discount),
          tax: Number(tax),
          total: sellingPrice * qty,
        });
      }
    }

    await cart.save();
    res.status(200).json({
      message: "Items added to cart successfully (stock check disabled)",
      cart,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Get Cart by User ID
exports.getCart = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(200).json({ cart: { items: [] } });
    }

    res.status(200).json({ cart });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Remove from Cart
exports.removeFromCart = async (req, res) => {
  try {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      return res
        .status(400)
        .json({ message: "userId and productId are required" });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const initialLength = cart.items.length;
    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId.toString(),
    );

    if (cart.items.length === initialLength) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    cart.updatedAt = new Date();
    await cart.save();

    res.status(200).json({ message: "Item removed from cart", cart });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Update Cart - NO STOCK CHECK
exports.updateCart = async (req, res) => {
  try {
    const { userId, productId, quantity, discount = 0, tax = 0 } = req.body;

    if (!userId || !productId || !Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ message: "Invalid update data" });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const existingItem = cart.items.find(
      (item) => item.productId.toString() === productId.toString(),
    );
    if (!existingItem) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    // STOCK CHECK REMOVED

    existingItem.quantity = quantity;
    existingItem.discount = Number(discount);
    existingItem.tax = Number(tax);
    existingItem.total =
      existingItem.price * quantity - Number(discount) + Number(tax);

    cart.updatedAt = new Date();
    await cart.save();

    res.status(200).json({ message: "Cart updated successfully", cart });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Clear Cart
exports.clearCart = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = [];
    cart.updatedAt = new Date();
    await cart.save();

    res.status(200).json({ message: "Cart cleared successfully", cart });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Reduce Quantity
exports.reduceQuantity = async (req, res) => {
  try {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      return res
        .status(400)
        .json({ message: "userId and productId are required" });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const existingItem = cart.items.find(
      (item) => item.productId.toString() === productId.toString(),
    );
    if (!existingItem) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    if (existingItem.quantity > 1) {
      existingItem.quantity -= 1;
      existingItem.total = existingItem.price * existingItem.quantity;
    } else {
      cart.items = cart.items.filter(
        (item) => item.productId.toString() !== productId.toString(),
      );
    }

    cart.updatedAt = new Date();
    await cart.save();

    res.status(200).json({
      message:
        existingItem.quantity > 0
          ? "Quantity reduced"
          : "Item removed from cart",
      cart,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
