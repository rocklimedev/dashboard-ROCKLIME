import React, { useState } from "react";
import { Card, Row, Col, Button, Spinner, Alert, Modal } from "react-bootstrap";
import OrderCart from "./OrderCart";
import ProductsList from "./ProductsList";
import Categories from "./Categories";
import ShowQuotations from "../POS/ShowQuotations";
import { useGetProfileQuery } from "../../api/userApi";
import { useGetAllQuotationsQuery } from "../../api/quotationApi";
import {
  useGetCartQuery,
  useAddProductToCartMutation,
  useClearCartMutation,
} from "../../api/cartApi";
import { useGetAllProductsQuery } from "../../api/productApi";
import { useGetAllInvoicesQuery } from "../../api/invoiceApi";
import { toast } from "react-toastify";

const POSWrapperNew = () => {
  const {
    data: user,
    isLoading: isUserLoading,
    isError: isUserError,
  } = useGetProfileQuery();
  const { data: quotations, isLoading: isQuotationsLoading } =
    useGetAllQuotationsQuery();
  const { data: products, isLoading: isProductsLoading } =
    useGetAllProductsQuery();
  const { data: cartData, refetch: refetchCart } = useGetCartQuery(
    user?.user?.userId,
    {
      skip: !user?.user?.userId,
    }
  );
  const {
    data: invoicesData,
    isLoading: isInvoicesLoading,
    error: invoicesError,
  } = useGetAllInvoicesQuery();
  const [addProductToCart] = useAddProductToCartMutation();
  const [clearCart] = useClearCartMutation();

  const [activeTab, setActiveTab] = useState("products");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCartModal, setShowCartModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Filter all invoices (no date restriction)
  const filterByTime = (items) => {
    if (!Array.isArray(items)) {
      console.warn("filterByTime: Items is not an array", items);
      return [];
    }
    return items;
  };

  // Filter invoices and products
  const invoices = filterByTime(invoicesData?.data || []);
  const filteredProducts =
    products?.data?.filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === null ||
        product.categoryId === selectedCategory ||
        product.parentCategoryId === selectedCategory;
      return matchesSearch && matchesCategory;
    }) || [];

  const handleConvertToCart = async (data, clearCartFlag = false) => {
    if (!data || !Array.isArray(data.products)) {
      toast.error("Invalid invoice data for cart conversion");
      return;
    }

    const userId = user?.user?.userId;
    if (!userId) {
      toast.error("User not logged in");
      return;
    }

    // Map invoice products to cart items
    const cartItems = data.products.map((product) => {
      const productDetails = products?.data?.find(
        (p) => p.productId === product.productId
      );

      return {
        id: product.productId,
        name: product.name || productDetails?.name || "Unknown Product",
        quantity: product.quantity || 1,
        price:
          product.sellingPrice ||
          product.price ||
          productDetails?.sellingPrice ||
          0,
      };
    });

    try {
      if (clearCartFlag) {
        await clearCart(userId).unwrap();
        toast.info("Cart cleared successfully");
      }

      for (const item of cartItems) {
        await addProductToCart({
          userId,
          productId: item.id,
          quantity: item.quantity,
        }).unwrap();
      }
      refetchCart();
      toast.success("Invoice converted to cart successfully!");
    } catch (error) {
      toast.error(
        `Failed to convert invoice to cart: ${
          error.data?.message || "Unknown error"
        }`
      );
    }
  };

  const handleInitiateConvertToCart = (invoice) => {
    if (cartData?.items?.length > 0) {
      // Show modal if cart is not empty
      setSelectedInvoice(invoice);
      setShowCartModal(true);
    } else {
      // Proceed directly if cart is empty
      handleConvertToCart(invoice);
    }
  };

  const handleConfirmClearCart = () => {
    setShowCartModal(false);
    handleConvertToCart(selectedInvoice, true); // Clear cart and add invoice items
    setSelectedInvoice(null);
  };

  const handleAddToCart = async () => {
    setShowCartModal(false);
    await handleConvertToCart(selectedInvoice); // Add invoice items to existing cart
    setSelectedInvoice(null);
  };

  const handleCancelCartAction = () => {
    setShowCartModal(false);
    setSelectedInvoice(null);
    toast.info("Cart conversion cancelled");
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  const userName = user?.user?.name || "Guest User";
  const userEmail = user?.user?.email || "No Email Provided";
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const renderTabContent = () => {
    switch (activeTab) {
      case "quotations":
        return (
          <ShowQuotations
            isQuotationsLoading={isQuotationsLoading}
            quotations={quotations}
            onConvertToOrder={handleInitiateConvertToCart}
          />
        );
      case "products":
        return (
          <div className="content-wrap">
            <Categories onCategorySelect={handleCategorySelect} />
            <ProductsList
              products={filteredProducts}
              isLoading={isProductsLoading}
            />
          </div>
        );
      case "invoices":
        return (
          <div className="invoice-list">
            {isInvoicesLoading ? (
              <div className="text-center py-4">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : invoicesError ? (
              <Alert variant="danger">
                Error loading invoices:{" "}
                {invoicesError?.data?.message || "Unknown error"}
              </Alert>
            ) : invoices.length === 0 ? (
              <p className="text-muted text-center">No invoices found.</p>
            ) : (
              <Row xs={1} md={2} lg={3} className="g-3">
                {invoices.map((invoice) => (
                  <Col key={invoice.invoiceId || invoice._id}>
                    <Card className="h-100 shadow-sm">
                      <Card.Body>
                        <Card.Title
                          as="h5"
                          className="fs-6 fw-bold text-primary"
                        >
                          Invoice #
                          {invoice.invoiceNo || invoice.invoiceId || "N/A"}
                        </Card.Title>
                        <Card.Text className="mb-1">
                          <span className="text-orange">Customer:</span>{" "}
                          {invoice.billTo || invoice.customerId || "Unknown"}
                        </Card.Text>
                        <Card.Text className="mb-1">
                          <span className="text-orange">Total:</span> Rs{" "}
                          {(
                            invoice.totalAmount ||
                            invoice.amount ||
                            0
                          ).toLocaleString()}
                        </Card.Text>
                        <Card.Text className="mb-2 text-muted fs-6">
                          Date:{" "}
                          {invoice.createdAt || invoice.invoiceDate
                            ? new Date(
                                invoice.createdAt || invoice.invoiceDate
                              ).toLocaleDateString()
                            : "N/A"}
                        </Card.Text>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="w-100"
                          onClick={() => handleInitiateConvertToCart(invoice)}
                          disabled={
                            !invoice.products || invoice.products.length === 0
                          }
                        >
                          Convert to Cart
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="page-wrapper pos-pg-wrapper ms-0">
      <div className="content pos-design p-0">
        <div className="row align-items-start pos-wrapper">
          <div className="col-md-12 col-lg-7 col-xl-8">
            <div className="pos-categories tabs_wrapper">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
                <div>
                  {isUserLoading ? (
                    <Spinner animation="border" variant="primary" />
                  ) : isUserError ? (
                    <h5 className="text-danger">Failed to Load User</h5>
                  ) : (
                    <>
                      <h5 className="mb-1">
                        <span className="text-orange me-2">👋</span> Welcome,{" "}
                        {userName}
                      </h5>
                      <p className="mb-1 text-muted">{userEmail}</p>
                      <p className="text-muted fs-6">
                        {currentDate} | {currentTime}
                      </p>
                    </>
                  )}
                </div>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <div className="input-icon-start pos-search position-relative">
                    <span className="input-icon-addon">
                      <i className="ti ti-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search Product"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button
                    variant={
                      activeTab === "invoices" ? "primary" : "outline-primary"
                    }
                    size="sm"
                    onClick={() => setActiveTab("invoices")}
                  >
                    <i className="ti ti-receipt me-1"></i> Invoices
                  </Button>
                  <Button
                    variant={
                      activeTab === "quotations" ? "primary" : "outline-primary"
                    }
                    size="sm"
                    onClick={() => setActiveTab("quotations")}
                  >
                    <i className="ti ti-star me-1"></i> Quotations
                  </Button>
                  <Button
                    variant={
                      activeTab === "products" ? "primary" : "outline-primary"
                    }
                    size="sm"
                    onClick={() => setActiveTab("products")}
                  >
                    <i className="ti ti-box me-1"></i> Products
                  </Button>
                </div>
              </div>
              {renderTabContent()}
            </div>
          </div>
          <OrderCart onConvertToOrder={handleInitiateConvertToCart} />
          {/* Cart Action Confirmation Modal */}
          <Modal show={showCartModal} onHide={handleCancelCartAction} centered>
            <Modal.Header closeButton>
              <Modal.Title>Cart Action Confirmation</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              Your cart already contains items. Would you like to clear the cart
              before adding products from this invoice, or add these products to
              the existing cart?
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleCancelCartAction}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleAddToCart}>
                Add to Existing Cart
              </Button>
              <Button variant="danger" onClick={handleConfirmClearCart}>
                Clear Cart and Proceed
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default POSWrapperNew;
