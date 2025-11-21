const Cart = require("../models/carts");
const Product = require("../models/product");
const User = require("../models/users");
const Quotation = require("../models/quotation");

// ──────────────────────────────────────────────────────
// META SLUGS – these UUIDs are the same for ALL products
// ──────────────────────────────────────────────────────
const META_SLUGS = {
  sellingPrice: "9ba862ef-f993-4873-95ef-1fef10036aa5",
  companyCode: "d11da9f9-3f2e-4536-8236-9671200cca4a",
  barcode: "4ded1cb3-5d31-42e8-90ec-a381a6ab1e35",
  productGroup: "81cd6d76-d7d2-4226-b48e-6704e6224c2b",
};

// ──────────────────────────────────────────────────────
// Reliable & synchronous price extractor
// ──────────────────────────────────────────────────────
const getSellingPrice = (meta) => {
  let parsedMeta = meta;

  // Step 1: If meta is a string → it’s double-encoded → fix it
  if (typeof meta === "string") {
    try {
      parsedMeta = JSON.parse(meta);
    } catch (e) {
      // If parsing fails, it's corrupted → fallback later
      parsedMeta = {};
    }
  }

  // Step 2: If still not an object → give up
  if (!parsedMeta || typeof parsedMeta !== "object") {
    return null;
  }

  // Step 3: Try known price UUID
  const PRICE_UUID = "9ba862ef-f993-4873-95ef-1fef10036aa5";
  let raw = parsedMeta[PRICE_UUID];

  // Step 4: Fallback — scan all values for anything that looks like a price
  if (!raw) {
    for (const value of Object.values(parsedMeta)) {
      if (
        typeof value === "string" &&
        /^\d{2,15}(\.\d{1,4})?$/.test(value.trim())
      ) {
        raw = value;
        break;
      }
      if (typeof value === "number" && value >= 1) {
        return value;
      }
    }
  }

  if (!raw) return null;

  // Step 5: Clean and parse aggressively
  const cleaned = String(raw)
    .replace(/[^\d.]/g, "") // Remove everything except digits and dot
    .replace(/\.(?=.*\.)/g, ""); // Keep only last dot

  const price = parseFloat(cleaned);
  return !isNaN(price) && price >= 1 ? price : null;
};

// ──────────────────────────────────────────────────────
// Add Single Product to Cart
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

    const sellingPrice = getSellingPrice(product.meta); // Fixed
    if (!sellingPrice) {
      return res.status(400).json({
        message: `Invalid or missing sellingPrice for product: ${productId}`,
      });
    }

    if (product.quantity < quantity) {
      return res
        .status(400)
        .json({ message: `Insufficient stock for product: ${productId}` });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) cart = new Cart({ userId, items: [] });

    const existingItem = cart.items.find(
      (i) => i.productId.toString() === productId.toString()
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
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ──────────────────────────────────────────────────────
// Bulk Add to Cart
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

      const sellingPrice = getSellingPrice(product.meta); // Fixed
      if (!sellingPrice) {
        return res
          .status(400)
          .json({ message: `Invalid sellingPrice for product: ${productId}` });
      }

      if (product.quantity < qty) {
        return res
          .status(400)
          .json({ message: `Insufficient stock for product: ${productId}` });
      }

      const existing = cart.items.find(
        (i) => i.productId.toString() === productId.toString()
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
    res.status(200).json({ message: "Items added to cart", cart });
  } catch (err) {
    console.error(err);
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
