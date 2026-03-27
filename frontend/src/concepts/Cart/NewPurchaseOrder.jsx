// src/pages/quotations/NewPurchaseOrder.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import moment from "moment";

import CartLayout from "./CartLayout";
import PurchaseOrderForm from "../../components/POS-NEW/PurchaseOrderForm";
import { useCreatePurchaseOrderMutation } from "../../api/poApi";
import { useGetVendorsQuery } from "../../api/vendorApi";
import { useGetAllProductsQuery } from "../../api/productApi";

const NewPurchaseOrder = () => {
  const navigate = useNavigate();

  const [createPurchaseOrder] = useCreatePurchaseOrderMutation();

  // ── Purchase Order Specific State ─────────────────────────────
  const [purchaseOrderData, setPurchaseOrderData] = useState({
    vendorId: "",
    orderDate: moment().format("YYYY-MM-DD"),
    expectedDeliveryDate: null,
    items: [],
    totalAmount: 0,
    status: "pending",
  });

  const [selectedVendor, setSelectedVendor] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);

  // ── Queries ───────────────────────────────────────────────────
  const { data: vendorsData } = useGetVendorsQuery();
  const { data: productsData } = useGetAllProductsQuery();

  const vendors = vendorsData || [];
  const products = productsData?.data || [];

  // ── Create Purchase Order Handler ─────────────────────────────
  const handleCreatePurchaseOrder = async (layoutProps) => {
    if (!selectedVendor) {
      return message.error("Please select a vendor.");
    }

    if (purchaseOrderData.items.length === 0) {
      return message.error(
        "Please add at least one item to the Purchase Order.",
      );
    }

    const formattedItems = purchaseOrderData.items.map((item) => ({
      productId: item.productId,
      quantity: Number(item.quantity) || 1,
      unitPrice: Number(item.mrp) || Number(item.unitPrice) || 0.01,
      mrp: Number(item.mrp) || 0.01,
      tax: Number(item.tax) || 0,
      discount: Number(item.discount) || 0,
      discountType: item.discountType || "percent",
    }));

    if (formattedItems.some((i) => i.mrp <= 0)) {
      return message.error("All items must have MRP > 0.");
    }

    const payload = {
      vendorId: selectedVendor,
      items: formattedItems,
      expectDeliveryDate: purchaseOrderData.expectedDeliveryDate
        ? moment(purchaseOrderData.expectedDeliveryDate).format("YYYY-MM-DD")
        : null,
    };

    try {
      const result = await createPurchaseOrder(payload).unwrap();
      message.success(
        `Purchase Order ${result.purchaseOrder?.poNumber} created!`,
      );
      navigate("/purchase-manager");
    } catch (err) {
      message.error(err?.data?.message || "Failed to create Purchase Order.");
    }
  };

  return (
    <CartLayout
      documentType="Purchase Order"
      onCreateDocument={handleCreatePurchaseOrder}
    >
      {(layoutProps) => (
        <PurchaseOrderForm
          purchaseOrderData={purchaseOrderData}
          setPurchaseOrderData={setPurchaseOrderData}
          selectedVendor={selectedVendor}
          setSelectedVendor={setSelectedVendor}
          vendors={vendors}
          products={products}
          productSearch={productSearch}
          filteredProducts={filteredProducts}
          debouncedSearch={(value) => {
            setProductSearch(value);
            if (value.trim()) {
              const filtered = products
                .filter(
                  (p) =>
                    p.name?.toLowerCase().includes(value.toLowerCase()) ||
                    p.product_code?.toLowerCase().includes(value.toLowerCase()),
                )
                .slice(0, 5);
              setFilteredProducts(filtered);
            } else {
              setFilteredProducts([]);
            }
          }}
          addPurchaseOrderProduct={(productId) => {
            const product = products.find((p) => p.productId === productId);
            if (
              !product ||
              purchaseOrderData.items.some((i) => i.productId === productId)
            ) {
              message.error(
                product ? "Product already added." : "Product not found.",
              );
              return;
            }

            const sellingPrice =
              product.metaDetails?.find((m) => m.slug === "sellingPrice")
                ?.value || 0;

            if (sellingPrice <= 0) {
              message.error(`Invalid MRP for ${product.name}`);
              return;
            }

            setPurchaseOrderData((prev) => {
              const newItems = [
                ...prev.items,
                {
                  id: product.productId,
                  productId: product.productId,
                  name: product.name,
                  quantity: 1,
                  mrp: sellingPrice,
                  total: sellingPrice,
                  tax: 0,
                },
              ];

              const totalAmount = newItems
                .reduce((s, i) => s + i.total * (1 + (i.tax || 0) / 100), 0)
                .toFixed(2);

              return { ...prev, items: newItems, totalAmount };
            });

            setProductSearch("");
            setFilteredProducts([]);
          }}
          removePurchaseOrderProduct={(index) => {
            setPurchaseOrderData((prev) => {
              const newItems = prev.items.filter((_, i) => i !== index);
              const totalAmount = newItems
                .reduce((s, i) => s + i.total * (1 + (i.tax || 0) / 100), 0)
                .toFixed(2);
              return { ...prev, items: newItems, totalAmount };
            });
          }}
          updatePurchaseOrderProductField={(index, field, value) => {
            const items = [...purchaseOrderData.items];
            items[index][field] = value;

            if (["quantity", "mrp", "tax"].includes(field)) {
              const q = Number(items[index].quantity) || 1;
              const m = Number(items[index].mrp) || 0.01;
              const t = Number(items[index].tax) || 0;
              items[index].total = q * m * (1 + t / 100);
            }

            const totalAmount = items
              .reduce((s, i) => s + i.total * (1 + (i.tax || 0) / 100), 0)
              .toFixed(2);

            setPurchaseOrderData({ ...purchaseOrderData, items, totalAmount });
          }}
          handlePurchaseOrderChange={(key, value) =>
            setPurchaseOrderData((prev) => ({ ...prev, [key]: value }))
          }
          purchaseOrderTotal={purchaseOrderData.totalAmount}
          documentType="Purchase Order"
          cartItems={layoutProps.localCartItems}
          setActiveTab={layoutProps.setActiveTab}
          handleCreateDocument={() => handleCreatePurchaseOrder(layoutProps)}
        />
      )}
    </CartLayout>
  );
};

export default NewPurchaseOrder;
