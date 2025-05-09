const Cart = require("../models/carts"); // MongoDB Model
const Product = require("../models/product"); // MySQL Model
const User = require("../models/users"); // MySQL Model
const Quotation = require("../models/quotation");
// ✅ Add Items to Cart
exports.addToCart = async (req, res) => {
  try {
    const { userId, items, customerId } = req.body;

    if (!userId || !customerId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message:
          "Invalid cart data: userId, customerId, and items are required",
      });
    }

    // Check if user exists in MySQL
    const userExists = await User.findByPk(userId);
    if (!userExists) {
      return res.status(404).json({ message: "User not found" });
    }

    let cart = await Cart.findOne({ userId, customerId });
    if (!cart) {
      cart = new Cart({ userId, customerId, items: [] });
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

      const sellingPrice = Number(product.sellingPrice);
      if (isNaN(sellingPrice)) {
        return res.status(400).json({ message: "Invalid product price" });
      }

      const totalPrice = sellingPrice * parsedQuantity;

      const existingItem = cart.items.find(
        (cartItem) => cartItem.productId.toString() === productId
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
    res.status(500).json({ error: err.message });
  }
};

exports.addProductToCart = async (req, res) => {
  try {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      return res
        .status(400)
        .json({ message: "userId and productId are required" });
    }

    // Check if user exists in MySQL
    const userExists = await User.findByPk(userId);
    if (!userExists) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if product exists in MySQL
    const product = await Product.findOne({ where: { productId } });
    if (!product) {
      return res
        .status(404)
        .json({ message: `Product not found: ${productId}` });
    }

    // Find or create a cart for the user
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // Check if the product is already in the cart
    const existingItem = cart.items.find(
      (item) => item.productId.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += 1;
      existingItem.total = existingItem.price * existingItem.quantity;
    } else {
      cart.items.push({
        productId,
        name: product.name,
        price: Number(product.sellingPrice),
        quantity: 1, // Default quantity to 1
        discount: 0,
        tax: 0,
        total: Number(product.sellingPrice),
      });
    }

    await cart.save();
    res.status(200).json({ message: "Product added to cart", cart });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
  }
};

// Remove from cart
// removeFromCart
exports.removeFromCart = async (req, res) => {
  try {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({ message: "Invalid data" });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const initialLength = cart.items.length;
    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId.toString()
    ); // Ensure string comparison

    if (cart.items.length === initialLength) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    cart.updatedAt = new Date();
    await cart.save();

    res.status(200).json({ message: "Item removed from cart", cart });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// updateCart
exports.updateCart = async (req, res) => {
  try {
    const { userId, productId, quantity, discount = 0, tax = 0 } = req.body;

    if (!userId || !productId || !quantity || quantity < 1) {
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

    // Temporary: Use existing price to isolate MySQL issue
    existingItem.quantity = Number(quantity); // Ensure number
    existingItem.discount = Number(discount);
    existingItem.tax = Number(tax);
    existingItem.total =
      existingItem.price * existingItem.quantity -
      existingItem.discount +
      existingItem.tax;

    cart.updatedAt = new Date();
    await cart.save();

    res.status(200).json({ message: "Cart updated successfully", cart });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// Clear cart
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
    res.status(500).json({ error: err.message });
  }
};

// ✅ Convert Quotation to Cart
exports.convertQuotationToCart = async (req, res) => {
  try {
    const { userId, quotationId } = req.body;

    if (!userId || !quotationId) {
      return res
        .status(400)
        .json({ message: "User ID and Quotation ID are required" });
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

    quotation.items.forEach((item) => {
      const existingItem = cart.items.find(
        (cartItem) => cartItem.productId.toString() === item.id.toString()
      );

      if (existingItem) {
        existingItem.quantity += item.quantity;
      } else {
        cart.items.push({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          discount: item.discount || 0,
          tax: item.tax || 0,
          total: item.price * item.quantity,
        });
      }
    });

    await cart.save();

    res
      .status(200)
      .json({ message: "Quotation converted to cart successfully", cart });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get Cart by User ID with Product Details
exports.getCartById = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Check if user exists in MySQL
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch cart from MongoDB
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(200).json({ cart: { items: [] } });
    }

    // Fetch product details from MySQL for each cart item
    const updatedItems = await Promise.all(
      cart.items.map(async (item) => {
        const product = await Product.findByPk(item.productId);

        if (!product) {
          return null; // Skip if product no longer exists
        }

        return {
          productId: item.productId,
          name: product.name,
          price: product.price,
          quantity: item.quantity,
          discount: item.discount || 0,
          tax: item.tax || 0,
          total: product.price * item.quantity,
        };
      })
    );

    // Filter out any null items (in case products were deleted)
    cart.items = updatedItems.filter((item) => item !== null);

    res.status(200).json({ cart });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get All Carts
exports.getAllCarts = async (req, res) => {
  try {
    const carts = await Cart.find(); // Fetch all cart documents
    res.status(200).json({ success: true, carts });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching carts", error });
  }
};

exports.reduceQuantity = async (req, res) => {
  try {
    const { userId, productId } = req.body;

    // Find the cart item
    const cartItem = await Cart.findOne({ userId, productId });

    if (!cartItem) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    // Decrease the quantity
    if (cartItem.quantity > 1) {
      cartItem.quantity -= 1;
      await cartItem.save();
      return res.status(200).json({ message: "Quantity reduced", cartItem });
    } else {
      // If quantity is 1, remove the item
      await Cart.deleteOne({ userId, productId });
      return res.status(200).json({ message: "Item removed from cart" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error reducing quantity", error });
  }
};
