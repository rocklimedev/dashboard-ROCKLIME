const Cart = require("../models/carts");
const Product = require("../models/product");
const User = require("../models/users"); // Import User model
const { v4: uuidv4 } = require("uuid");
const Quotation = require("../models/Quotation");
exports.addToCart = async (req, res) => {
  try {
    console.log("Request Body:", req.body);
    const { userId, items } = req.body;

    if (!userId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Invalid cart data" });
    }

    const userExists = await User.findByPk(userId);
    if (!userExists) {
      return res.status(404).json({ message: "User not found" });
    }

    let cart = await Cart.findOne({ where: { user_id: userId } });

    if (!cart) {
      cart = await Cart.create({ user_id: userId, items: [] });
    }

    // Ensure items is always an array
    cart.items = cart.items || [];

    for (let item of items) {
      const { productId, quantity, discount = 0, tax = 0 } = item;
      const parsedQuantity = Number(quantity);

      if (!productId || isNaN(parsedQuantity) || parsedQuantity < 1) {
        return res.status(400).json({ message: "Invalid cart item data" });
      }

      const product = await Product.findByPk(productId);
      if (!product) {
        return res
          .status(404)
          .json({ message: `Product not found: ${productId}` });
      }

      const existingItem = cart.items.find(
        (cartItem) => cartItem.productId === productId
      );

      if (existingItem) {
        existingItem.quantity += parsedQuantity;
      } else {
        cart.items.push({
          productId,
          quantity: parsedQuantity,
          discount,
          tax,
          total: product.price * parsedQuantity,
        });
      }
    }

    await cart.save();
    res.status(200).json({ message: "Items added to cart", cart });
  } catch (err) {
    console.error("Error adding to cart:", err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({ message: "Invalid request" });
    }

    let cart = await Cart.findOne({ where: { userId } });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = cart.items.filter((item) => item.productId !== productId);

    await cart.save();
    res.status(200).json({ message: "Item removed from cart", cart });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getCart = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const cart = await Cart.findOne({ where: { user_id: userId } });

    if (!cart) {
      return res.status(200).json({ cart: { items: [] } }); // Return empty cart instead of error
    }

    res.status(200).json({ cart });
  } catch (err) {
    console.error("Error fetching cart:", err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.getCartById = async (req, res) => {
  try {
    const { cartId } = req.params;

    const cart = await Cart.findByPk(cartId);

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    res.status(200).json({ cart });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.convertQuotationToCart = async (quotationId) => {
  try {
    console.log("Received quotationId:", quotationId, typeof quotationId); // 🔍 Debugging log

    if (typeof quotationId !== "string") {
      throw new Error("Invalid quotationId format");
    }

    const quotation = await Quotation.findByPk(quotationId);
    if (!quotation) throw new Error("Quotation not found");

    const { customerId, products } = quotation;
    if (!customerId || !Array.isArray(products))
      throw new Error("Invalid quotation data");

    const cartItems = products.map((product) => ({
      productId: product.productId,
      name: product.name,
      price: parseFloat(product.sellingPrice),
      quantity: product.qty,
    }));

    let cart = await Cart.findOne({ where: { user_id: customerId } });

    if (cart) {
      cart.items = [...(cart.items || []), ...cartItems];
      cart.updated_at = new Date();
    } else {
      cart = await Cart.create({
        id: uuidv4(),
        user_id: customerId,
        items: cartItems,
      });
    }

    await cart.save();
    return { success: true, message: "Quotation added to cart", cart };
  } catch (error) {
    console.error("Error converting quotation to cart:", error.message);
    return { success: false, message: error.message };
  }
};

exports.clearCart = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    let cart = await Cart.findOne({ where: { user_id: userId } });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = []; // Clear all items
    await cart.save();

    res.status(200).json({ message: "Cart cleared successfully", cart });
  } catch (err) {
    console.error("Error clearing cart:", err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.updateCart = async (req, res) => {
  try {
    const { userId, productId, quantity, discount = 0, tax = 0 } = req.body;

    if (!userId || !productId || isNaN(quantity) || quantity < 1) {
      return res.status(400).json({ message: "Invalid update data" });
    }

    let cart = await Cart.findOne({ where: { user_id: userId } });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const existingItem = cart.items.find(
      (item) => item.productId === productId
    );

    if (!existingItem) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Update item details
    existingItem.quantity = quantity;
    existingItem.discount = discount;
    existingItem.tax = tax;
    existingItem.total = product.price * quantity;

    await cart.save();

    res.status(200).json({ message: "Cart updated successfully", cart });
  } catch (err) {
    console.error("Error updating cart:", err.message);
    res.status(500).json({ error: err.message });
  }
};
