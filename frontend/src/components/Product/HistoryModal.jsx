import React from "react";
import { useGetHistoryByProductIdQuery } from "../../api/productApi";
const HistoryModal = ({ isVisible, onClose, product }) => {
  const { data, isLoading, error } = useGetHistoryByProductByIdQuery(
    product?.productId
  );

  if (!isVisible) return null;
  if (isLoading) return <p>Loading history...</p>;
  if (error) return <p>Error fetching history.</p>;

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h4>Stock History for {product.name}</h4>
        <ul>
          {data?.history?.map((entry, i) => (
            <li key={i}>
              <strong>{entry.type.toUpperCase()}</strong> - {entry.quantity}{" "}
              units on {new Date(entry.date).toLocaleString()}
            </li>
          ))}
        </ul>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default HistoryModal;
