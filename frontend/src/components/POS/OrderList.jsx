import React, { useState } from "react";
import { useGetCustomersQuery } from "../../api/customerApi";
import {
  useGetCartQuery,
  useUpdateCartMutation,
  useClearCartMutation,
  useRemoveFromCartMutation,
} from "../../api/cartApi";
import AddCustomer from "../Customers/AddCustomer";
import { useGetProfileQuery } from "../../api/userApi";
import OrderTotal from "./OrderTotal";
import PaymentMethod from "./PaymentMethod";
import { toast } from "react-toastify";
import InvoiceDetails from "./InvoiceDetails";

const OrderList = ({ onConvertToOrder }) => {
  const {
    data: profileData,
    isLoading: profileLoading,
    error: profileError,
  } = useGetProfileQuery();
  const userId = profileData?.user?.userId;

  const {
    data: cartData,
    isLoading: cartLoading,
    isError: cartError,
    refetch,
  } = useGetCartQuery(userId, { skip: !userId });

  const {
    data: customerData,
    isLoading: customersLoading,
    isError: customersError,
  } = useGetCustomersQuery();

  const [updateCart] = useUpdateCartMutation();
  const [clearCart] = useClearCartMutation();
  const [removeFromCart] = useRemoveFromCartMutation();

  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState("");

  const customers = customerData?.data || [];
  const customerList = Array.isArray(customers) ? customers : [];
  const cartItems = Array.isArray(cartData?.cart?.items)
    ? cartData.cart.items
    : [];

  const totalItems = cartItems.reduce(
    (acc, item) => acc + (item.quantity || 0),
    0
  );
  const totalAmount = cartItems.reduce(
    (acc, item) => acc + (item.price || 0) * (item.quantity || 0),
    0
  );

  const handleClearCart = async () => {
    if (!userId) {
      toast.error("User not logged in!");
      return;
    }

    try {
      await clearCart(userId).unwrap(); // Pass userId to clearCart
      toast.success("Cart cleared!");
      refetch();
    } catch (error) {
      console.error("Clear cart error:", error);
      toast.error(`Error: ${error.data?.message || "Failed to clear cart"}`);
    }
  };

  const handleUpdateQuantity = async (productId, newQuantity) => {
    if (!userId) return toast.error("User not logged in!");

    try {
      if (newQuantity <= 0) {
        await removeFromCart({ userId, productId }).unwrap();
        toast.success("Item removed from cart!");
      } else {
        await updateCart({
          userId,
          productId,
          quantity: Number(newQuantity),
        }).unwrap();
        toast.success("Quantity updated!");
      }
      refetch();
    } catch (error) {
      console.error("Update/Remove error:", error);
      toast.error(`Error: ${error.data?.message || "Unknown error"}`);
    }
  };

  const handleRemoveItem = async (productId) => {
    if (!userId) return toast.error("User not logged in!");

    try {
      await removeFromCart({ userId, productId }).unwrap();
      toast.success("Item removed from cart!");
      refetch();
    } catch (error) {
      console.error("Remove error:", error);
      toast.error(`Error: ${error.data?.message || "Unknown error"}`);
    }
  };

  const handlePlaceOrder = () => {
    if (!selectedCustomer) {
      toast.error("Please select a customer before placing an order.");
      return;
    }

    if (!userId) {
      toast.error("User not logged in!");
      return;
    }

    const selectedCustomerData = customerList.find(
      (customer) => customer.customerId === selectedCustomer
    );

    const orderData = {
      customerId: selectedCustomerData?.customerId || "",
      userId,
      items: cartItems.map((item) => ({
        id: item?.productId || "",
        name: item?.name || "Unnamed Product",
        price: item?.price || 0,
        quantity: item?.quantity || 1,
        total: (item?.price || 0) * (item?.quantity || 1),
      })),
      totalAmount: totalAmount || 0,
    };

    try {
      onConvertToOrder(orderData);
      handleClearCart();
    } catch (error) {
      console.error("Place order error:", error);
      toast.error("Failed to place order");
    }
  };

  if (profileLoading || cartLoading) {
    return <div>Loading cart...</div>;
  }

  if (profileError || cartError) {
    return (
      <div>
        Error loading cart: {profileError?.message || cartError?.message}
        <button onClick={refetch}>Retry</button>
      </div>
    );
  }

  return (
    <div className="col-md-12 col-lg-5 col-xl-4 ps-0 theiaStickySidebar d-lg-flex">
      <aside className="product-order-list bg-secondary-transparent flex-fill">
        <div className="card">
          <div className="card-body">
            <div className="order-head d-flex align-items-center justify-content-between w-100">
              <h3>Order List</h3>
              <div className="d-flex align-items-center gap-2">
                <span className="badge badge-dark fs-10 fw-medium badge-xs">
                  ORDER #123
                </span>
                <button
                  className="link-danger fs-16 border-0 bg-transparent"
                  onClick={handleClearCart}
                >
                  <i className="ti ti-trash-x-filled"></i>
                </button>
              </div>
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
                  {customersLoading ? (
                    <option>Loading...</option>
                  ) : customersError ? (
                    <option>Error fetching customers</option>
                  ) : (
                    customerList.map((customer) => (
                      <option
                        key={customer.customerId}
                        value={customer.customerId}
                      >
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
                          <tr key={item.productId}>
                            <td>
                              <div className="d-flex align-items-center">
                                <button
                                  onClick={() =>
                                    handleRemoveItem(item.productId)
                                  }
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
                                      item.productId,
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
                                      item.productId,
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
                              ₹{item.price * item.quantity}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          <OrderTotal
            shipping={40}
            tax={25}
            coupon={25}
            discount={15}
            roundOff={0}
            subTotal={totalAmount}
          />
        </div>
        <InvoiceDetails
          billTo="John Doe"
          shipTo="123 Street, Mumbai, India"
          invoiceDate="2025-03-28"
          dueDate="2025-04-05"
          signatureName="Mr. Sharma"
        />

        <PaymentMethod />

        <div className="btn-row d-flex align-items-center justify-content-between gap-3">
          <button className="btn btn-white flex-fill">
            <i className="ti ti-printer me-2"></i>Print Order
          </button>
          <button
            className="btn btn-secondary flex-fill"
            onClick={handlePlaceOrder}
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
