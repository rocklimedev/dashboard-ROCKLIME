import React, { useState } from "react";
import { useGetCustomersQuery } from "../../api/customerApi";
import {
  useGetCartQuery,
  useUpdateCartMutation,
  useClearCartMutation,
} from "../../api/cartApi";
import AddCustomer from "../Customers/AddCustomer";
import OrderTotal from "./OrderTotal";

const OrderList = ({ onConvertToOrder }) => {
  const { data: customerData, isLoading, isError } = useGetCustomersQuery();
  const { data: cartData } = useGetCartQuery();
  const [updateCart] = useUpdateCartMutation();
  const [clearCart] = useClearCartMutation();

  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState("");

  const customers = customerData?.data || [];
  const customerList = Array.isArray(customers) ? customers : [];

  const cartItems = cartData?.items || [];
  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const handleClearCart = () => {
    clearCart();
  };

  const handleRemoveItem = (itemId) => {
    updateCart({ itemId, quantity: 0 });
  };

  const handleUpdateQuantity = (itemId, newQuantity) => {
    if (newQuantity >= 1) {
      updateCart({ itemId, quantity: newQuantity });
    }
  };

  return (
    <div className="col-md-12 col-lg-5 col-xl-4 ps-0 theiaStickySidebar d-lg-flex">
      <aside className="product-order-list bg-secondary-transparent flex-fill">
        <div className="card">
          <div className="card-body">
            <div className="order-head d-flex align-items-center justify-content-between w-100">
              <h3>Order List</h3>
              <button
                className="link-danger fs-16 border-0 bg-transparent"
                onClick={handleClearCart}
              >
                <i className="ti ti-trash-x-filled"></i>
              </button>
            </div>

            <div className="customer-info block-section">
              <h5 className="mb-2">Customer Information</h5>
              <div className="d-flex align-items-center gap-2">
                <select
                  className="form-select"
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                >
                  <option value="">Walk-in Customer</option>
                  {isLoading ? (
                    <option>Loading...</option>
                  ) : isError ? (
                    <option>Error fetching customers</option>
                  ) : (
                    customerList.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))
                  )}
                </select>
                <button
                  onClick={() => setShowModal(true)}
                  className="btn btn-teal btn-icon fs-20"
                >
                  <i className="ti ti-user-plus"></i>
                </button>
              </div>
            </div>

            <div className="product-added block-section">
              <div className="head-text d-flex align-items-center justify-content-between mb-3">
                <h5 className="me-2">Order Details</h5>
                <span className="badge bg-light text-gray-9 fs-12 fw-semibold py-2 border rounded">
                  Items: <span className="text-teal">{totalItems}</span>
                </span>
                <button
                  onClick={handleClearCart}
                  className="clear-icon fs-10 fw-medium border-0 bg-transparent"
                >
                  Clear all
                </button>
              </div>

              <div className="product-wrap">
                {cartItems.length === 0 ? (
                  <div className="empty-cart">
                    <i className="ti ti-shopping-cart fs-24 mb-1"></i>
                    <p className="fw-bold">No Products Selected</p>
                  </div>
                ) : (
                  <div className="product-list border-0 p-0">
                    <table className="table table-borderless">
                      <thead>
                        <tr>
                          <th className="fw-bold bg-light">Item</th>
                          <th className="fw-bold bg-light">QTY</th>
                          <th className="fw-bold bg-light text-end">Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cartItems.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <button
                                  onClick={() => handleRemoveItem(item.id)}
                                  className="delete-icon border-0 bg-transparent"
                                >
                                  <i className="ti ti-trash-x-filled"></i>
                                </button>
                                <h6 className="fs-13 fw-normal">{item.name}</h6>
                              </div>
                            </td>
                            <td>
                              <div className="qty-item m-0">
                                <button
                                  onClick={() =>
                                    handleUpdateQuantity(
                                      item.id,
                                      item.quantity - 1
                                    )
                                  }
                                  className="dec border-0 bg-transparent"
                                >
                                  <i className="ti ti-minus"></i>
                                </button>
                                <input
                                  type="text"
                                  className="form-control text-center"
                                  value={item.quantity}
                                  readOnly
                                />
                                <button
                                  onClick={() =>
                                    handleUpdateQuantity(
                                      item.id,
                                      item.quantity + 1
                                    )
                                  }
                                  className="inc border-0 bg-transparent"
                                >
                                  <i className="ti ti-plus"></i>
                                </button>
                              </div>
                            </td>
                            <td className="fs-13 fw-semibold text-gray-9 text-end">
                              ${item.price * item.quantity}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <OrderTotal />
            </div>
          </div>
        </div>

        <div className="btn-row d-flex align-items-center justify-content-between gap-3">
          <button className="btn btn-white flex-fill">
            <i className="ti ti-printer me-2"></i>Print Order
          </button>
          <button
            className="btn btn-secondary flex-fill"
            onClick={() => onConvertToOrder(cartItems, selectedCustomer)}
          >
            <i className="ti ti-shopping-cart me-2"></i>Place Order
          </button>
        </div>
      </aside>

      {showModal && <AddCustomer onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default OrderList;
