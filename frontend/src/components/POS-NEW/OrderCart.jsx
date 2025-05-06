import React, { useState, useEffect } from "react";
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
import { useCreateInvoiceMutation } from "../../api/invoiceApi";
import { FcEmptyTrash } from "react-icons/fc";
import { BiTrash } from "react-icons/bi";
import InvoiceDetails from "../POS/InvoiceDetails";
const OrderCart = ({ onConvertToOrder }) => {
  const {
    data: profileData,
    isLoading: profileLoading,
    error: profileError,
  } = useGetProfileQuery();
  const userId = profileData?.user?.userId;

  const [createInvoice] = useCreateInvoiceMutation();
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

  const initialInvoiceData = {
    invoiceDate: "",
    dueDate: "",
    shipTo: "",
    signatureName: "",
    billTo: "",
  };

  const [invoiceData, setInvoiceData] = useState(initialInvoiceData);
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [error, setError] = useState("");

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

  const validateDueDate = () => {
    const { invoiceDate, dueDate } = invoiceData;
    if (invoiceDate && dueDate) {
      const invoice = new Date(invoiceDate);
      const due = new Date(dueDate);
      if (due <= invoice) {
        setError("Due date must be after invoice date");
      } else {
        setError("");
      }
    }
  };

  useEffect(() => {
    validateDueDate();
  }, [invoiceData.invoiceDate, invoiceData.dueDate]);

  const handleInvoiceChange = (key, value) => {
    setInvoiceData((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearCart = async () => {
    if (!userId) {
      toast.error("User not logged in!");
      return;
    }

    try {
      await clearCart({ userId }).unwrap();
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

  const handlePlaceOrder = async () => {
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
      createdFor: selectedCustomerData?.customerId || "",
      createdBy: userId,
      products: cartItems.map((item) => ({
        id: item?.productId || "",
        name: item?.name || "Unnamed Product",
        price: item?.price || 0,
        quantity: item?.quantity || 1,
        total: (item?.price || 0) * (item?.quantity || 1),
      })),
      totalAmount: totalAmount || 0,
    };

    try {
      const invoiceDataToSubmit = {
        createdBy: userId,
        customerId: selectedCustomerData.customerId,
        billTo: invoiceData.billTo,
        shipTo: invoiceData.shipTo,
        amount: totalAmount,
        orderNumber: orderData.orderNumber || "ORD123",
        invoiceDate: invoiceData.invoiceDate,
        dueDate: invoiceData.dueDate,
        paymentMethod: "Cash",
        status: "Pending",
        orderId: orderData.orderId || "ORD123",
        products: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
        signatureName: invoiceData.signatureName,
      };
      console.log(orderData);
      await createInvoice(invoiceDataToSubmit).unwrap();
      onConvertToOrder(orderData);
      handleClearCart();
      toast.success("Order placed and invoice created successfully!");
      // Reset form data
      setInvoiceData(initialInvoiceData);
      setSelectedCustomer("");
    } catch (error) {
      console.error("Place order error:", error);
      toast.error(
        `Failed to place order or create invoice: ${
          error.data?.message || "Unknown error"
        }`
      );
    }
  };

  if (profileLoading || cartLoading) {
    return (
      <div className="text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (profileError || cartError) {
    return (
      <div className="alert alert-danger">
        Error loading cart: {profileError?.message || cartError?.message}
        <button className="btn btn-primary mt-2" onClick={refetch}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div class="col-md-12 col-lg-5 col-xl-4 ps-0 theiaStickySidebar">
      <aside class="product-order-list">
        <div class="customer-info">
          <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
            <div class="d-flex align-items-center">
              <h4 class="mb-0">New Order</h4>
              <span class="badge badge-purple badge-xs fs-10 fw-medium ms-2">
                #5655898
              </span>
            </div>
            <a
              href="#"
              class="btn btn-sm btn-outline-primary shadow-primary"
              data-bs-toggle="modal"
              data-bs-target="#create"
            >
              Add Customer
            </a>
          </div>
          <select
            class="select"
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
          >
            {customersLoading ? (
              <option>Loading...</option>
            ) : customersError ? (
              <option>Error fetching customers</option>
            ) : (
              customerList.map((customer) => (
                <option key={customer.customerId} value={customer.customerId}>
                  {customer.name}
                </option>
              ))
            )}
          </select>
        </div>
        <div class="product-added block-section">
          <div class="d-flex align-items-center justify-content-between gap-3 mb-3">
            <h5 class="d-flex align-items-center mb-0">Order Details</h5>
            <div class="badge bg-light text-gray-9 fs-12 fw-semibold py-2 border rounded">
              Items : <span class="text-teal">{totalItems}</span>
            </div>
          </div>
          <div class="product-wrap">
            {cartItems.length === 0 ? (
              <div class="empty-cart">
                <div class="mb-1" onClick={handleClearCart}>
                  <FcEmptyTrash />
                </div>
                <p class="fw-bold">No Products Selected</p>
              </div>
            ) : (
              <div class="product-list border-0 p-0">
                <div class="table-responsive">
                  <table class="table table-borderless">
                    <thead>
                      <tr>
                        <th class="bg-transparent fw-bold">Product</th>
                        <th class="bg-transparent fw-bold">QTY</th>
                        <th class="bg-transparent fw-bold">Price</th>
                        <th class="bg-transparent fw-bold text-end"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cartItems.map((item) => (
                        <tr key={item.productId}>
                          <td>
                            <div class="d-flex align-items-center mb-1">
                              <h6 class="fs-16 fw-medium">
                                <a
                                  href="#"
                                  data-bs-toggle="modal"
                                  data-bs-target="#products"
                                >
                                  {item.name}
                                </a>
                              </h6>
                              <button
                                onClick={() => handleRemoveItem(item.productId)}
                                className="delete-icon border-0 bg-transparent"
                              >
                                <BiTrash />
                              </button>
                            </div>
                            {item.sellingPrice}
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
              </div>
            )}
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
        <InvoiceDetails
          invoiceData={invoiceData}
          onChange={handleInvoiceChange}
        />
        <PaymentMethod />

        <div className="btn-row d-flex align-items-center justify-content-between gap-3">
          <button className="btn btn-white flex-fill">
            <i className="ti ti-printer me-2"></i>Print Order
          </button>
          <button
            className="btn btn-secondary flex-fill"
            onClick={handlePlaceOrder}
            disabled={cartItems.length === 0 || error}
          >
            <i className="ti ti-shopping-cart me-2"></i>Generate Invoice
          </button>
        </div>
      </aside>
    </div>
  );
};

export default OrderCart;
