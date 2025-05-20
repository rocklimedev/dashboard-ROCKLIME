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
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useCreateInvoiceMutation } from "../../api/invoiceApi";
import { FcEmptyTrash } from "react-icons/fc";
import { BiTrash } from "react-icons/bi";
import InvoiceDetails from "../POS/InvoiceDetails";
import { v4 as uuidv4 } from "uuid";
import { useGetAllAddressesQuery } from "../../api/addressApi";
const generateInvoiceNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `INV-${timestamp}-${random}`;
};

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

  const {
    data: addressesData,
    isLoading: addressesLoading,
    isError: addressesError,
  } = useGetAllAddressesQuery(userId, { skip: !userId });

  const [updateCart] = useUpdateCartMutation();
  const [clearCart] = useClearCartMutation();
  const [removeFromCart] = useRemoveFromCartMutation();

  const initialInvoiceData = {
    invoiceDate: "",
    dueDate: "",
    shipTo: null,
    signatureName: "CM TRADING CO",
    billTo: "",
  };

  const [invoiceData, setInvoiceData] = useState(initialInvoiceData);
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [error, setError] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState(generateInvoiceNumber());

  const customers = customerData?.data || [];
  const customerList = Array.isArray(customers) ? customers : [];
  const addresses = Array.isArray(addressesData?.data)
    ? addressesData.data
    : [];
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

  // Set billTo and attempt to match shipTo when customer is selected
  useEffect(() => {
    if (selectedCustomer && addresses.length > 0) {
      const selectedCustomerData = customerList.find(
        (customer) => customer.customerId === selectedCustomer
      );
      if (selectedCustomerData) {
        // Default billTo to customer name, user can edit
        setInvoiceData((prev) => ({
          ...prev,
          billTo: selectedCustomerData.name || "",
          shipTo: null,
        }));

        // Match customer's address JSON to addresses table
        if (selectedCustomerData.address) {
          const customerAddress = selectedCustomerData.address;
          // Normalize customer address keys (e.g., zipCode to postalCode)
          const normalizedCustomerAddress = {
            street: customerAddress.street || "",
            city: customerAddress.city || "",
            state: customerAddress.state || "",
            postalCode:
              customerAddress.zipCode || customerAddress.postalCode || "",
            country: customerAddress.country || "",
          };
          const customerAddressString = JSON.stringify(
            normalizedCustomerAddress
          );

          const matchingAddress = addresses.find((addr) => {
            if (!addr.addressDetails) return false;
            // Normalize addressDetails for comparison
            const normalizedAddrDetails = {
              street: addr.addressDetails.street || "",
              city: addr.addressDetails.city || "",
              state: addr.addressDetails.state || "",
              postalCode: addr.addressDetails.postalCode || "",
              country: addr.addressDetails.country || "",
            };
            return (
              JSON.stringify(normalizedAddrDetails) === customerAddressString
            );
          });
        }
      }
    } else {
      setInvoiceData(initialInvoiceData);
    }
  }, [selectedCustomer, customerList, addresses]);

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
      setInvoiceNumber(generateInvoiceNumber());
      refetch();
    } catch (error) {
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

    if (!invoiceData.invoiceDate || !invoiceData.dueDate) {
      toast.error("Please provide invoice and due dates.");
      return;
    }

    if (!invoiceData.billTo) {
      toast.error("Please provide a billing name or address.");
      return;
    }

    if (error) {
      toast.error("Please fix the errors before submitting.");
      return;
    }

    const selectedCustomerData = customerList.find(
      (customer) => customer.customerId === selectedCustomer
    );

    if (!selectedCustomerData) {
      toast.error("Selected customer not found.");
      return;
    }

    const orderId = uuidv4();
    const orderData = {
      id: orderId,
      title: `Order for ${selectedCustomerData.name}`,
      createdFor: selectedCustomerData.customerId,
      createdBy: userId,
      status: "INVOICE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      products: cartItems.map((item) => ({
        id: item?.productId || "",
        name: item?.name || "Unnamed Product",
        price: item?.price || 0,
        quantity: item?.quantity || 1,
        total: (item?.price || 0) * (item?.quantity || 1),
      })),
      totalAmount: totalAmount || 0,
      invoiceId: null,
    };

    const invoiceDataToSubmit = {
      invoiceId: uuidv4(),
      createdBy: userId,
      customerId: selectedCustomerData.customerId,
      billTo: invoiceData.billTo,
      shipTo: invoiceData.shipTo,
      amount: totalAmount,
      invoiceDate: invoiceData.invoiceDate,
      dueDate: invoiceData.dueDate,
      paymentMethod: JSON.stringify({ method: "Cash" }),
      status: "unpaid",
      products: JSON.stringify(
        cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        }))
      ),
      signatureName: invoiceData.signatureName || "CM TRADING CO",
      invoiceNo: invoiceNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const response = await createInvoice(invoiceDataToSubmit).unwrap();
      orderData.invoiceId = response.invoice.invoiceId;
      onConvertToOrder(orderData);
      await handleClearCart();
      toast.success("Order placed and invoice created successfully!");
      setInvoiceData(initialInvoiceData);
      setSelectedCustomer("");
      setInvoiceNumber(generateInvoiceNumber());
    } catch (error) {
      console.error("Invoice creation error:", error);
      toast.error(
        `Failed to place order or create invoice: ${
          error.data?.message || error.status || "Unknown error"
        }`
      );
    }
  };

  if (profileLoading || cartLoading || customersLoading || addressesLoading) {
    return (
      <div className="text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (profileError || cartError || customersError || addressesError) {
    return (
      <div className="alert alert-danger">
        Error loading data:{" "}
        {profileError?.message ||
          cartError?.message ||
          customersError?.message ||
          addressesError?.message}
        <button className="btn btn-primary mt-2" onClick={refetch}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="col-md-12 col-lg-5 col-xl-4 ps-0 theiaStickySidebar">
      <ToastContainer />
      <aside className="product-order-list">
        <div className="customer-info">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
            <div className="d-flex align-items-center">
              <h4 className="mb-0">New Order</h4>
              <span className="badge badge-purple badge-xs fs-10 fw-medium ms-2">
                #{invoiceNumber}
              </span>
            </div>
            <a
              href="#"
              className="btn btn-sm btn-outline-primary shadow-primary"
              onClick={() => setShowModal(true)}
            >
              Add Customer
            </a>
          </div>
          <select
            className="form-select"
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            disabled={customersLoading || customersError}
          >
            <option value="">Select a customer</option>
            {customersLoading ? (
              <option disabled>Loading...</option>
            ) : customersError ? (
              <option disabled>Error fetching customers</option>
            ) : customerList.length === 0 ? (
              <option disabled>No customers available</option>
            ) : (
              customerList.map((customer) => (
                <option key={customer.customerId} value={customer.customerId}>
                  {customer.name} ({customer.email})
                </option>
              ))
            )}
          </select>
        </div>
        {showModal && (
          <AddCustomer
            onClose={() => setShowModal(false)}
            existingCustomer={null}
          />
        )}
        <div className="product-added block-section">
          <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
            <h5 className="d-flex align-items-center mb-0">Order Details</h5>
            <div className="badge bg-light text-gray-9 fs-12 fw-semibold py-2 border rounded">
              Items: <span className="text-teal">{totalItems}</span>
            </div>
          </div>
          <div className="product-wrap">
            {cartItems.length === 0 ? (
              <div className="empty-cart">
                <div className="mb-1" onClick={handleClearCart}>
                  <FcEmptyTrash />
                </div>
                <p className="fw-bold">No Products Selected</p>
              </div>
            ) : (
              <div className="product-list border-0 p-0">
                <div className="table-responsive">
                  <table className="table table-borderless">
                    <thead>
                      <tr>
                        <th className="bg-transparent fw-bold">Product</th>
                        <th className="bg-transparent fw-bold">QTY</th>
                        <th className="bg-transparent fw-bold">Price</th>
                        <th className="bg-transparent fw-bold text-end"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cartItems.map((item) => (
                        <tr key={item.productId}>
                          <td>
                            <div className="d-flex align-items-center mb-1">
                              <h6 className="fs-16 fw-medium">
                                <a>{item.name}</a>
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
          error={error}
        />
        <PaymentMethod />
        <div className="btn-row d-flex align-items-center justify-content-between gap-3">
          <button className="btn btn-white flex-fill">
            <i className="ti ti-printer me-2"></i>Print Order
          </button>
          <button
            className="btn btn-secondary flex-fill"
            onClick={handlePlaceOrder}
            disabled={
              cartItems.length === 0 ||
              error ||
              customersLoading ||
              addressesLoading
            }
          >
            <i className="ti ti-shopping-cart me-2"></i>Generate Invoice
          </button>
        </div>
      </aside>
    </div>
  );
};

export default OrderCart;
