import React, { useState } from "react";

import {
  useAddStockMutation,
  useRemoveStockMutation,
} from "../../api/productApi";
const StockModal = ({ isVisible, onClose, product }) => {
  const [quantity, setQuantity] = useState(0);
  const [type, setType] = useState("in"); // "in" or "out"
  const [updateStock] = useAddStockMutation();
  const [removeStock] = useRemoveStockMutation();

  const handleSubmit = async () => {
    const payload = {
      productId: product.productId,
      quantity: Number(quantity),
    };

    try {
      if (type === "in") {
        await updateStock(payload).unwrap();
      } else {
        await removeStock(payload).unwrap();
      }
      onClose();
    } catch (error) {
      console.error("Stock update failed", error);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h4>Update Stock for {product.name}</h4>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="in">Stock In</option>
          <option value="out">Stock Out</option>
        </select>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="Enter quantity"
        />
        <button onClick={handleSubmit}>Submit</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default StockModal;
