import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Spin,
  Typography,
  Divider,
  Tabs,
  Select,
  InputNumber,
  DatePicker,
  Table,
} from "antd";
import { DeleteOutlined } from "@ant-design/icons";

import { useClearCartMutation } from "../../api/cartApi";
import { useGetProfileQuery } from "../../api/userApi";

import { toast } from "sonner";

import styled from "styled-components";
import PropTypes from "prop-types";
import "react-lazy-load-image-component/src/effects/blur.css";

import moment from "moment";
import { useCreatePurchaseOrderMutation } from "../../api/poApi";
import { useGetVendorsQuery } from "../../api/vendorApi";

import { debounce } from "lodash";
import { useGetAllProductsQuery } from "../../api/productApi";

const { Title, Text } = Typography;
const { Option } = Select;

const CartSummaryCard = styled(Card)`
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 16px;
  @media (min-width: 768px) {
    top: 20px;
  }
`;

const PURCHASE_ORDER_STATUSES = [
  "pending",
  "confirmed",
  "delivered",
  "cancelled",
];
const PurchaseOrderForm = ({
  selectedVendor,
  setSelectedVendor,
  purchaseOrderData,
  setPurchaseOrderData,
  productSearch,
  setProductSearch,
  filteredProducts,
  setFilteredProducts,
  purchaseOrderNumber,
  cartItems,
  resetForm,
  setShowAddVendorModal,
  setActiveTab,
}) => {
  const navigate = useNavigate();
  const { data: vendorsData, isLoading: isVendorsLoading } =
    useGetVendorsQuery();
  const { data: productsData, isLoading: isProductsLoading } =
    useGetAllProductsQuery();
  const [createPurchaseOrder] = useCreatePurchaseOrderMutation();
  const {
    data: profileData,
    isLoading: profileLoading,
    error: profileError,
  } = useGetProfileQuery();
  const [clearCart] = useClearCartMutation();
  const userId = profileData?.user?.userId;

  const vendors = useMemo(() => vendorsData || [], [vendorsData]);
  const products = useMemo(() => productsData || [], [productsData]);

  const debouncedSearch = useCallback(
    debounce((value) => {
      setProductSearch(value);
      if (value) {
        const filtered = products
          .filter(
            (product) =>
              product.productId &&
              (product.name.toLowerCase().includes(value.toLowerCase()) ||
                product.product_code
                  ?.toLowerCase()
                  .includes(value.toLowerCase()))
          )
          .slice(0, 5);
        setFilteredProducts(filtered);
      } else {
        setFilteredProducts([]);
      }
    }, 300),
    [products, setProductSearch, setFilteredProducts]
  );

  useEffect(() => {
    setPurchaseOrderData((prev) => ({
      ...prev,
      items: cartItems.map((item) => ({
        id: item.productId,
        productId: item.productId,
        name: item.name || "Unknown",
        quantity: item.quantity || 1,
        mrp: item.price || 0.01,
        total: (item.quantity || 1) * (item.price || 0.01),
      })),
      totalAmount: cartItems
        .reduce(
          (sum, item) => sum + (item.quantity || 1) * (item.price || 0),
          0
        )
        .toFixed(2),
    }));
  }, [cartItems, setPurchaseOrderData]);

  const addPurchaseOrderProduct = (productId) => {
    const product = products.find((p) => p.productId === productId);
    if (
      !product ||
      purchaseOrderData.items.some((item) => item.productId === productId)
    ) {
      if (!product) toast.error("Product not found.");
      else toast.error("Product already added.");
      return;
    }
    const sellingPrice =
      product.metaDetails?.find((meta) => meta.slug === "sellingPrice")
        ?.value || 0;
    if (sellingPrice <= 0) {
      toast.error(
        `Product ${product.name} has an invalid MRP (₹${sellingPrice}).`
      );
      return;
    }
    const quantity = 1;
    const total = quantity * sellingPrice;
    setPurchaseOrderData((prev) => {
      const newItems = [
        ...prev.items,
        {
          id: product.productId,
          productId: product.productId,
          name: product.name || "Unknown",
          quantity,
          mrp: sellingPrice,
          total,
        },
      ];
      const totalAmount = newItems
        .reduce((sum, item) => sum + Number(item.total || 0), 0)
        .toFixed(2);
      return {
        ...prev,
        items: newItems,
        totalAmount,
      };
    });
    setProductSearch("");
    setFilteredProducts([]);
  };

  const removePurchaseOrderProduct = (index) => {
    setPurchaseOrderData((prev) => {
      const newItems = prev.items.filter((_, i) => i !== index);
      const totalAmount = newItems
        .reduce((sum, item) => sum + Number(item.total || 0), 0)
        .toFixed(2);
      return {
        ...prev,
        items: newItems,
        totalAmount,
      };
    });
  };

  const updatePurchaseOrderProductField = (index, field, value) => {
    const updatedItems = [...purchaseOrderData.items];
    updatedItems[index][field] = value;
    if (["quantity", "mrp"].includes(field)) {
      const quantity = Number(updatedItems[index].quantity) || 1;
      const mrp = Number(updatedItems[index].mrp) || 0.01;
      updatedItems[index].total = quantity * mrp;
    }
    const totalAmount = updatedItems
      .reduce((sum, item) => sum + Number(item.total || 0), 0)
      .toFixed(2);
    setPurchaseOrderData({
      ...purchaseOrderData,
      items: updatedItems,
      totalAmount,
    });
  };

  const handleCreatePurchaseOrder = async () => {
    if (!selectedVendor) return toast.error("Please select a vendor.");
    if (purchaseOrderData.items.length === 0)
      return toast.error("Please add at least one product.");
    if (purchaseOrderData.items.some((item) => item.mrp <= 0))
      return toast.error("All products must have a valid MRP greater than 0.");
    if (
      purchaseOrderData.items.some(
        (item) => !products.some((p) => p.productId === item.productId)
      )
    )
      return toast.error(
        "Some products are no longer available. Please remove them."
      );

    const formattedItems = purchaseOrderData.items.map((item) => ({
      productId: item.productId,
      quantity: Number(item.quantity) || 1,
      mrp: Number(item.mrp) || 0.01,
    }));

    const formattedFormData = {
      vendorId: selectedVendor,
      items: formattedItems,
      expectedDeliveryDate: purchaseOrderData.expectedDeliveryDate
        ? moment(purchaseOrderData.expectedDeliveryDate).format("YYYY-MM-DD")
        : null,
      status: purchaseOrderData.status || "pending",
    };

    try {
      await createPurchaseOrder(formattedFormData).unwrap();
      await clearCart({ userId }).unwrap();
      resetForm();
      navigate("/po/list");
    } catch (err) {
      const errorMessage =
        err.status === 404
          ? "Vendor not found."
          : err.status === 400
          ? `Invalid request: ${
              err.data?.error || err.data?.message || "Check your input data."
            }`
          : err.data?.message || "Failed to create purchase order";
      toast.error(errorMessage);
    }
  };

  const purchaseOrderColumns = [
    {
      title: "Product",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Quantity",
      key: "quantity",
      render: (_, record, index) => (
        <InputNumber
          min={1}
          value={record.quantity}
          onChange={(value) =>
            updatePurchaseOrderProductField(index, "quantity", value || 1)
          }
          aria-label={`Quantity for ${record.name}`}
        />
      ),
    },
    {
      title: "MRP (₹)",
      key: "mrp",
      render: (_, record, index) => (
        <InputNumber
          min={0.01}
          step={0.01}
          value={record.mrp}
          onChange={(value) =>
            updatePurchaseOrderProductField(index, "mrp", value || 0.01)
          }
          aria-label={`MRP for ${record.name}`}
        />
      ),
    },
    {
      title: "Total (₹)",
      dataIndex: "total",
      key: "total",
      render: (total) => Number(total || 0).toFixed(2),
    },
    {
      title: "Action",
      key: "action",
      render: (_, __, index) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removePurchaseOrderProduct(index)}
          aria-label={`Remove ${purchaseOrderData.items[index].name}`}
        />
      ),
    },
  ];

  return (
    <CartSummaryCard>
      <Title level={3} style={{ fontSize: "18px" }}>
        Purchase Order Details
      </Title>
      <Divider />
      <Text strong>Vendor</Text>
      <div style={{ display: "flex", alignItems: "center" }}>
        <Select
          style={{ width: "100%", marginTop: 8 }}
          value={selectedVendor}
          onChange={setSelectedVendor}
          placeholder="Select a vendor"
          disabled={isVendorsLoading}
          aria-label="Select a vendor"
          showSearch
          filterOption={(input, option) =>
            option.children.toLowerCase().includes(input.toLowerCase())
          }
        >
          {vendors.length === 0 ? (
            <Option value="" disabled>
              No vendors available
            </Option>
          ) : (
            vendors.map((vendor) => (
              <Option key={vendor.id} value={vendor.id}>
                {vendor.vendorName}
              </Option>
            ))
          )}
        </Select>
        <Button
          type="primary"
          style={{ marginLeft: 8, marginTop: 8 }}
          onClick={() => setShowAddVendorModal(true)}
          aria-label="Add new vendor"
        >
          +
        </Button>
      </div>
      <Divider />
      <Text strong>Search Products</Text>
      <Select
        showSearch
        style={{ width: "100%", marginTop: 8 }}
        placeholder="Search by product name or code"
        onSearch={debouncedSearch}
        onChange={addPurchaseOrderProduct}
        filterOption={false}
        loading={isProductsLoading}
        aria-label="Search products"
        notFoundContent={
          isProductsLoading ? <Spin size="small" /> : "No products found"
        }
      >
        {filteredProducts.map((product, index) => (
          <Option
            key={product.productId ?? `fallback-${index}`}
            value={product.productId}
          >
            {product.name} ({product.product_code ?? "N/A"})
          </Option>
        ))}
      </Select>
      <Divider />
      <Table
        columns={purchaseOrderColumns}
        dataSource={purchaseOrderData.items}
        rowKey={(record, index) => record.id ?? `item-${index}`}
        locale={{ emptyText: "No products added" }}
        pagination={false}
      />
      <Divider />
      <Text strong>Order Date</Text>
      <DatePicker
        style={{ width: "100%", marginTop: 8 }}
        value={
          purchaseOrderData.orderDate
            ? moment(purchaseOrderData.orderDate)
            : null
        }
        onChange={(date) =>
          setPurchaseOrderData((prev) => ({
            ...prev,
            orderDate: date ? date.format("YYYY-MM-DD") : null,
          }))
        }
        format="YYYY-MM-DD"
      />
      <Divider />
      <Text strong>Expected Delivery Date</Text>
      <DatePicker
        style={{ width: "100%", marginTop: 8 }}
        value={
          purchaseOrderData.expectedDeliveryDate
            ? moment(purchaseOrderData.expectedDeliveryDate)
            : null
        }
        onChange={(date) =>
          setPurchaseOrderData((prev) => ({
            ...prev,
            expectedDeliveryDate: date ? date.format("YYYY-MM-DD") : null,
          }))
        }
        format="YYYY-MM-DD"
      />
      <Divider />
      <Text strong>Status</Text>
      <Select
        value={purchaseOrderData.status}
        onChange={(value) =>
          setPurchaseOrderData((prev) => ({ ...prev, status: value }))
        }
        style={{ width: "100%", marginTop: 8 }}
        placeholder="Select status"
      >
        {PURCHASE_ORDER_STATUSES.map((status) => (
          <Option key={status} value={status}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Option>
        ))}
      </Select>
      <Button
        id="po-submit"
        style={{ display: "none" }}
        onClick={handleCreatePurchaseOrder}
      />
    </CartSummaryCard>
  );
};

PurchaseOrderForm.propTypes = {
  selectedVendor: PropTypes.string,
  setSelectedVendor: PropTypes.func.isRequired,
  purchaseOrderData: PropTypes.object.isRequired,
  setPurchaseOrderData: PropTypes.func.isRequired,
  productSearch: PropTypes.string.isRequired,
  setProductSearch: PropTypes.func.isRequired,
  filteredProducts: PropTypes.array.isRequired,
  setFilteredProducts: PropTypes.func.isRequired,
  purchaseOrderNumber: PropTypes.string.isRequired,
  cartItems: PropTypes.array.isRequired,
  resetForm: PropTypes.func.isRequired,
  setShowAddVendorModal: PropTypes.func.isRequired,
  setActiveTab: PropTypes.func.isRequired,
};

export default PurchaseOrderForm;
