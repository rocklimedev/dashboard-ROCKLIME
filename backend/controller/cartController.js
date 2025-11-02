const Cart = require("../models/carts"); // MongoDB Model
const Product = require("../models/product"); // MySQL Model
const User = require("../models/users"); // MySQL Model
const Quotation = require("../models/quotation");

// Helper function to extract and validate sellingPrice
const ProductMeta = require("../models/productMeta"); // Import ProductMeta model

// Helper function to extract and validate sellingPrice
const getSellingPrice = (meta) => {
  if (!meta || typeof meta !== "object") return null;

  // Try to find a key with value that looks like a selling price
  const priceEntry = Object.entries(meta).find(([_, val]) => {
    return !isNaN(val) && parseFloat(val) > 0;
  });

  if (!priceEntry) return null;

  const [_, price] = priceEntry;
  const parsedPrice = parseFloat(price);
  return isNaN(parsedPrice) ? null : parsedPrice;
};

// ✅ Add Product to Cart
// ✅ Add Product to Cart
exports.addProductToCart = async (req, res) => {
  try {
    const { userId, productId, quantity = 1 } = req.body;

    if (!userId || !productId || !Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        message: "userId, productId, and valid quantity are required",
      });
    }

    // Check if user exists in MySQL
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if product exists in MySQL
    const product = await Product.findOne({ where: { productId } });
    if (!product) {
      return res
        .status(404)
        .json({ message: `Product not found: ${productId}` });
    }

    // Extract and validate sellingPrice
    const sellingPrice = await getSellingPrice(product.meta, productId);
    if (sellingPrice === null) {
      return res
        .status(400)
        .json({ message: `Invalid sellingPrice for product: ${productId}` });
    }

    // Check stock availability
    if (product.quantity < quantity) {
      return res
        .status(400)
        .json({ message: `Insufficient stock for product: ${productId}` });
    }

    // Find or create a cart for the user
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // Check if the product is already in the cart
    const existingItem = cart.items.find(
      (item) => item.productId.toString() === productId.toString()
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

    res.status(200).json({ message: "Product added to cart", cart });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Add Items to Cart
exports.addToCart = async (req, res) => {
  try {
    const { userId, items, customerId } = req.body;

    if (!userId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "userId and items are required",
      });
    }

    // Check if user exists in MySQL
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find or create a cart
    let cart = await Cart.findOne({ userId, customerId: customerId || null });
    if (!cart) {
      cart = new Cart({ userId, customerId: customerId || null, items: [] });
    }

    for (let item of items) {
      const { productId, quantity, discount = 0, tax = 0 } = item;

      const parsedQuantity = Number(quantity);
      if (!productId || isNaN(parsedQuantity) || parsedQuantity < 1) {
        return res.status(400).json({ message: "Invalid cart item data" });
      }

      // Fetch product from MySQL
      const product = await Product.findOne({ where: { productId } });
      if (!product) {
        return res
          .status(404)
          .json({ message: `Product not found: ${productId}` });
      }

      // Extract and validate sellingPrice
      const sellingPrice = await getSellingPrice(product.meta, productId);
      if (sellingPrice === null) {
        return res
          .status(400)
          .json({ message: `Invalid sellingPrice for product: ${productId}` });
      }

      // Check stock availability
      if (product.quantity < parsedQuantity) {
        return res
          .status(400)
          .json({ message: `Insufficient stock for product: ${productId}` });
      }

      const totalPrice = sellingPrice * parsedQuantity;

      const existingItem = cart.items.find(
        (cartItem) => cartItem.productId.toString() === productId.toString()
      );

      if (existingItem) {
        existingItem.quantity += parsedQuantity;
        existingItem.total = existingItem.price * existingItem.quantity;
      } else {
        cart.items.push({
          productId,
          name: product.name,
          price: sellingPrice,
          quantity: parsedQuantity,
          discount: Number(discount),
          tax: Number(tax),
          total: totalPrice,
        });
      }
    }

    await cart.save();
    res.status(200).json({ message: "Items added to cart", cart });
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
      (item) => item.productId.toString() !== productId.toString()
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

// ✅ Update Cart
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
      (item) => item.productId.toString() === productId.toString()
    );
    if (!existingItem) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    // Check stock availability
    const product = await Product.findOne({ where: { productId } });
    if (!product) {
      return res
        .status(404)
        .json({ message: `Product not found: ${productId}` });
    }
    if (product.quantity < quantity) {
      return res
        .status(400)
        .json({ message: `Insufficient stock for product: ${productId}` });
    }

    existingItem.quantity = quantity;
    existingItem.discount = Number(discount);
    existingItem.tax = Number(tax);
    existingItem.total = existingItem.price * quantity - discount + tax;

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

// ✅ Convert Quotation to Cart
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
      if (product.quantity < item.quantity) {
        continue; // Skip if insufficient stock
      }

      const sellingPrice = getSellingPrice(product.meta, item.id);
      if (sellingPrice === null) {
        console.warn(`Skipping product ${item.id} due to invalid sellingPrice`);
        continue;
      }

      const existingItem = cart.items.find(
        (cartItem) => cartItem.productId.toString() === item.id.toString()
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

        const sellingPrice = getSellingPrice(product.meta, item.productId);
        if (sellingPrice === null) {
          console.warn(
            `Removing item ${item.productId} from cart due to invalid sellingPrice`
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
      })
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
      (item) => item.productId.toString() === productId.toString()
    );
    if (!existingItem) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    if (existingItem.quantity > 1) {
      existingItem.quantity -= 1;
      existingItem.total = existingItem.price * existingItem.quantity;
    } else {
      cart.items = cart.items.filter(
        (item) => item.productId.toString() !== productId.toString()
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
