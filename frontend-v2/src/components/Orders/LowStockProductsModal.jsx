import React, { useMemo } from "react";
import { Modal, Table, Tag, Empty, Spin, Alert, Typography, Space } from "antd";
import {
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DatabaseOutlined,
} from "@ant-design/icons";

import {
  useGetLowStockProductsByOrderIdQuery,
  useGetLowStockProductsByProductIdsQuery,
} from "../../api/orderApi";

const { Text } = Typography;

const LowStockProductsModal = ({
  visible,
  orderId,
  products: orderProducts = [],
  onClose,
}) => {
  // ============================================================
  // NORMALIZE FRONTEND PRODUCTS
  // ============================================================

  const normalizedProducts = useMemo(() => {
    if (!Array.isArray(orderProducts)) {
      return [];
    }

    return orderProducts
      .map((item) => {
        if (!item) {
          return null;
        }

        const product =
          item.product || item.productData || item.productDetails || {};

        const productId =
          item.productId ||
          item.product_id ||
          item.productID ||
          product.productId ||
          product.product_id ||
          product.productID ||
          product.id ||
          item.id ||
          null;

        if (!productId) {
          return null;
        }

        // --------------------------------------------------------
        // NAME
        // --------------------------------------------------------
        //
        // Do NOT allow "—" to override the real product name.
        //

        const itemName = item.name && item.name !== "—" ? item.name : null;

        const productName =
          product.name && product.name !== "—" ? product.name : null;

        // --------------------------------------------------------
        // PRODUCT CODE
        // --------------------------------------------------------

        const productCode =
          item.productCode ||
          item.product_code ||
          product.productCode ||
          product.product_code ||
          null;

        // --------------------------------------------------------
        // COMPANY CODE
        // --------------------------------------------------------

        const companyCode =
          item.companyCode ||
          item.company_code ||
          product.companyCode ||
          product.company_code ||
          null;

        // --------------------------------------------------------
        // IMAGE
        // --------------------------------------------------------

        let imageUrl =
          item.imageUrl ||
          item.image_url ||
          product.imageUrl ||
          product.image_url ||
          null;

        if (!imageUrl && product.images) {
          if (Array.isArray(product.images)) {
            imageUrl = product.images[0] || null;
          } else if (typeof product.images === "string") {
            try {
              const parsed = JSON.parse(product.images);

              if (Array.isArray(parsed)) {
                imageUrl = parsed[0] || null;
              } else if (typeof parsed === "string") {
                imageUrl = parsed;
              }
            } catch {
              if (
                product.images.startsWith("http://") ||
                product.images.startsWith("https://")
              ) {
                imageUrl = product.images;
              }
            }
          }
        }

        return {
          productId: String(productId),

          name: itemName || productName || "—",

          productCode,

          companyCode,

          imageUrl,

          quantity: Number(
            item.quantity ?? item.orderedQuantity ?? item.orderQuantity ?? 0,
          ),

          price: Number(item.price ?? 0),

          discount: Number(item.discount ?? 0),

          discountType: item.discountType || "percent",

          tax: Number(item.tax ?? 0),

          total: Number(item.total ?? 0),

          raw: item,
        };
      })
      .filter(Boolean);
  }, [orderProducts]);
  // ============================================================
  // CREATE ORDER REQUEST
  // ============================================================
  //
  // IMPORTANT:
  //
  // Backend expects:
  //
  // {
  //   products: [
  //     {
  //       productId,
  //       quantity,
  //       name,
  //       productCode
  //     }
  //   ]
  // }
  //
  // NOT:
  //
  // {
  //   productIds: [...]
  // }
  //
  // ============================================================

  const incomingProducts = useMemo(() => {
    return normalizedProducts.map((product) => ({
      productId: product.productId,
      quantity: product.quantity,
      name: product.name,
      imageUrl: product.imageUrl,
      productCode: product.productCode,
      companyCode: product.companyCode,
      price: product.price,
      discount: product.discount,
      discountType: product.discountType,
      tax: product.tax,
      total: product.total,
    }));
  }, [normalizedProducts]);
  // ============================================================
  // EXISTING ORDER
  // ============================================================

  const {
    data: orderInventoryData,
    isLoading: isOrderLoading,
    isFetching: isOrderFetching,
    isError: isOrderError,
    error: orderInventoryError,
    refetch: refetchOrderInventory,
  } = useGetLowStockProductsByOrderIdQuery(orderId, {
    skip: !visible || !orderId,
  });

  // ============================================================
  // CREATE ORDER
  // ============================================================
  //
  // This query uses the existing endpoint:
  //
  // POST /order/low-stock-products
  //
  // The RTK query currently accepts an array, but its body MUST
  // be converted to:
  //
  // {
  //   products: [...]
  // }
  //
  // ============================================================

  const {
    data: productInventoryData,
    isLoading: isProductLoading,
    isFetching: isProductFetching,
    isError: isProductError,
    error: productInventoryError,
    refetch: refetchProductInventory,
  } = useGetLowStockProductsByProductIdsQuery(incomingProducts, {
    skip: Boolean(orderId) || !visible || incomingProducts.length === 0,
  });

  // ============================================================
  // NORMALIZE BACKEND RESPONSE
  // ============================================================

  const normalizeProducts = (response) => {
    if (!response) {
      return [];
    }

    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response.products)) {
      return response.products;
    }

    if (Array.isArray(response.data)) {
      return response.data;
    }

    if (Array.isArray(response.data?.products)) {
      return response.data.products;
    }

    return [];
  };

  // ============================================================
  // BACKEND PRODUCTS
  // ============================================================

  const backendProducts = useMemo(() => {
    if (orderId) {
      return normalizeProducts(orderInventoryData);
    }

    return normalizeProducts(productInventoryData);
  }, [orderId, orderInventoryData, productInventoryData]);

  // ============================================================
  // GET PRODUCT ID
  // ============================================================

  const getProductId = (record) => {
    if (!record) {
      return null;
    }

    const product =
      record.product || record.productData || record.productDetails || {};

    return (
      record.productId ||
      record.product_id ||
      record.productID ||
      product.productId ||
      product.product_id ||
      product.productID ||
      product.id ||
      record.id ||
      null
    );
  };

  // ============================================================
  // MERGE CREATE PRODUCTS WITH BACKEND INVENTORY
  // ============================================================
  //
  // Frontend:
  // quantity = ORDERED quantity
  //
  // Backend:
  // currentStock = ACTUAL inventory
  //
  // Backend:
  // alertQuantity = INVENTORY ALERT LEVEL
  //
  // ============================================================

  const products = useMemo(() => {
    // ----------------------------------------------------------
    // EXISTING ORDER
    // ----------------------------------------------------------

    if (orderId) {
      return backendProducts;
    }

    // ----------------------------------------------------------
    // CREATE ORDER
    // ----------------------------------------------------------

    return normalizedProducts
      .map((item) => {
        const productId = String(item.productId);

        const inventoryRecord = backendProducts.find(
          (inventory) => String(getProductId(inventory)) === productId,
        );

        // --------------------------------------------------------
        // BACKEND DID NOT RETURN THIS PRODUCT
        // --------------------------------------------------------

        if (!inventoryRecord) {
          return {
            ...item,

            productId,

            orderedQuantity: item.quantity,

            availableInInventory: false,

            inventoryStatus: "UNKNOWN",

            currentStock: null,

            alertQuantity: null,

            shortage: null,

            isLowStock: true,

            isBelowAlertLevel: false,

            insufficientForOrder: false,
          };
        }

        // --------------------------------------------------------
        // BACKEND IS SOURCE OF TRUTH
        // --------------------------------------------------------

        return {
          ...item,

          ...inventoryRecord,

          productId,

          // Product details
          name: inventoryRecord.name || item.name || "—",

          productCode: inventoryRecord.productCode || item.productCode || null,

          companyCode: inventoryRecord.companyCode || item.companyCode || null,

          imageUrl: inventoryRecord.imageUrl || item.imageUrl || null,

          // IMPORTANT:
          // Backend may return orderedQuantity = 0 because the
          // request did not contain the order quantity previously.
          //
          // Always prefer the current order form quantity.
          orderedQuantity: item.quantity,

          // Backend inventory
          currentStock:
            inventoryRecord.currentStock !== undefined
              ? Number(inventoryRecord.currentStock)
              : null,

          alertQuantity:
            inventoryRecord.alertQuantity !== null &&
            inventoryRecord.alertQuantity !== undefined
              ? Number(inventoryRecord.alertQuantity)
              : null,

          availableInInventory: inventoryRecord.availableInInventory !== false,

          inventoryStatus: inventoryRecord.inventoryStatus || "UNKNOWN",

          // Recalculate shortage against CURRENT ORDER quantity.
          shortage:
            inventoryRecord.currentStock !== undefined &&
            inventoryRecord.currentStock !== null
              ? Math.max(
                  Number(item.quantity || 0) -
                    Number(inventoryRecord.currentStock || 0),
                  0,
                )
              : null,

          insufficientForOrder:
            inventoryRecord.currentStock !== undefined &&
            inventoryRecord.currentStock !== null
              ? Number(item.quantity || 0) >
                Number(inventoryRecord.currentStock || 0)
              : false,

          isBelowAlertLevel:
            inventoryRecord.alertQuantity !== null &&
            inventoryRecord.alertQuantity !== undefined &&
            inventoryRecord.currentStock !== undefined &&
            inventoryRecord.currentStock !== null
              ? Number(inventoryRecord.currentStock) <=
                Number(inventoryRecord.alertQuantity)
              : false,
        };
      })
      .filter(Boolean);
  }, [orderId, normalizedProducts, backendProducts]);

  // ============================================================
  // PRODUCT NAME
  // ============================================================

  const getProductName = (record) => {
    return record?.name || record?.productName || record?.product?.name || "—";
  };

  // ============================================================
  // PRODUCT CODE
  // ============================================================

  const getProductCode = (record) => {
    return (
      record?.productCode ||
      record?.product_code ||
      record?.product?.productCode ||
      record?.product?.product_code ||
      null
    );
  };

  // ============================================================
  // COMPANY CODE
  // ============================================================

  const getCompanyCode = (record) => {
    return (
      record?.companyCode ||
      record?.company_code ||
      record?.product?.companyCode ||
      record?.product?.company_code ||
      null
    );
  };

  // ============================================================
  // ORDERED QUANTITY
  // ============================================================

  const getOrderedQuantity = (record) => {
    return Number(
      record?.orderedQuantity ??
        record?.quantity ??
        record?.orderQuantity ??
        record?.orderItem?.quantity ??
        0,
    );
  };

  // ============================================================
  // AVAILABLE STOCK
  // ============================================================

  const getAvailableStock = (record) => {
    if (
      record?.availableInInventory === false &&
      record?.inventoryStatus === "NOT_FOUND"
    ) {
      return null;
    }

    if (record?.currentStock !== undefined && record?.currentStock !== null) {
      return Number(record.currentStock);
    }

    if (
      record?.availableStock !== undefined &&
      record?.availableStock !== null
    ) {
      return Number(record.availableStock);
    }

    if (record?.stock !== undefined && record?.stock !== null) {
      return Number(record.stock);
    }

    return null;
  };

  // ============================================================
  // ALERT QUANTITY
  // ============================================================

  const getAlertQuantity = (record) => {
    if (record?.alertQuantity !== undefined && record?.alertQuantity !== null) {
      return Number(record.alertQuantity);
    }

    if (
      record?.alert_quantity !== undefined &&
      record?.alert_quantity !== null
    ) {
      return Number(record.alert_quantity);
    }

    if (
      record?.product?.alertQuantity !== undefined &&
      record?.product?.alertQuantity !== null
    ) {
      return Number(record.product.alertQuantity);
    }

    if (
      record?.product?.alert_quantity !== undefined &&
      record?.product?.alert_quantity !== null
    ) {
      return Number(record.product.alert_quantity);
    }

    return null;
  };

  // ============================================================
  // STOCK STATUS
  // ============================================================

  const getStockStatus = (record) => {
    // Backend already calculated the status.
    if (
      record?.inventoryStatus &&
      [
        "AVAILABLE",
        "LOW_STOCK",
        "OUT_OF_STOCK",
        "INSUFFICIENT",
        "NOT_FOUND",
      ].includes(record.inventoryStatus)
    ) {
      return record.inventoryStatus;
    }

    const stock = getAvailableStock(record);
    const alertQuantity = getAlertQuantity(record);
    const orderedQuantity = getOrderedQuantity(record);

    if (record?.availableInInventory === false) {
      return "NOT_FOUND";
    }

    if (stock === null) {
      return "UNKNOWN";
    }

    if (stock <= 0) {
      return "OUT_OF_STOCK";
    }

    if (stock < orderedQuantity) {
      return "INSUFFICIENT";
    }

    if (alertQuantity !== null && stock <= alertQuantity) {
      return "LOW_STOCK";
    }

    return "AVAILABLE";
  };

  // ============================================================
  // ONLY PRODUCTS REQUIRING ATTENTION
  // ============================================================

  const attentionProducts = useMemo(() => {
    return products.filter((record) => {
      const status = getStockStatus(record);

      return [
        "OUT_OF_STOCK",
        "LOW_STOCK",
        "INSUFFICIENT",
        "NOT_FOUND",
        "UNKNOWN",
      ].includes(status);
    });
  }, [products]);

  // ============================================================
  // LOADING
  // ============================================================

  const isLoadingInventory = orderId
    ? isOrderLoading || isOrderFetching
    : isProductLoading || isProductFetching;

  // ============================================================
  // ERROR
  // ============================================================

  const isInventoryError = orderId ? isOrderError : isProductError;

  const inventoryError = orderId ? orderInventoryError : productInventoryError;

  // ============================================================
  // REFRESH
  // ============================================================

  const handleRefresh = () => {
    if (orderId) {
      refetchOrderInventory();
      return;
    }

    if (incomingProducts.length > 0) {
      refetchProductInventory();
    }
  };

  // ============================================================
  // TABLE COLUMNS
  // ============================================================

  const columns = [
    {
      title: "Product",
      key: "product",
      fixed: "left",
      width: 300,

      render: (_, record) => {
        const name = getProductName(record);
        const productCode = getProductCode(record);
        const companyCode = getCompanyCode(record);

        return (
          <div>
            <Text strong>{name}</Text>

            {productCode && (
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {productCode}
                </Text>
              </div>
            )}

            {companyCode && (
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {companyCode}
                </Text>
              </div>
            )}
          </div>
        );
      },
    },

    {
      title: "Ordered",
      key: "orderedQuantity",
      width: 100,
      align: "center",

      render: (_, record) => {
        return getOrderedQuantity(record);
      },
    },

    {
      title: "Available Stock",
      key: "currentStock",
      width: 140,
      align: "center",

      render: (_, record) => {
        const status = getStockStatus(record);
        const stock = getAvailableStock(record);

        if (status === "NOT_FOUND") {
          return (
            <Tag color="red" icon={<DatabaseOutlined />}>
              NOT FOUND
            </Tag>
          );
        }

        if (stock === null) {
          return <Tag color="default">UNKNOWN</Tag>;
        }

        if (stock <= 0) {
          return (
            <Tag color="red" icon={<CloseCircleOutlined />}>
              {stock}
            </Tag>
          );
        }

        if (status === "LOW_STOCK" || status === "INSUFFICIENT") {
          return (
            <Tag color="orange" icon={<WarningOutlined />}>
              {stock}
            </Tag>
          );
        }

        return (
          <Tag color="green" icon={<CheckCircleOutlined />}>
            {stock}
          </Tag>
        );
      },
    },

    {
      title: "Alert At",
      key: "alertQuantity",
      width: 100,
      align: "center",

      render: (_, record) => {
        const alertQuantity = getAlertQuantity(record);

        if (alertQuantity === null) {
          return "—";
        }

        return alertQuantity;
      },
    },

    {
      title: "Shortage",
      key: "shortage",
      width: 110,
      align: "center",

      render: (_, record) => {
        const ordered = getOrderedQuantity(record);

        const stock = getAvailableStock(record);

        if (stock === null) {
          return "—";
        }

        const shortage = Math.max(ordered - stock, 0);

        if (shortage > 0) {
          return <Tag color="volcano">{shortage}</Tag>;
        }

        return <Tag color="green">0</Tag>;
      },
    },

    {
      title: "Status",
      key: "status",
      width: 180,
      align: "center",

      render: (_, record) => {
        const status = getStockStatus(record);

        switch (status) {
          case "OUT_OF_STOCK":
            return (
              <Tag color="red" icon={<CloseCircleOutlined />}>
                OUT OF STOCK
              </Tag>
            );

          case "INSUFFICIENT":
            return (
              <Tag color="volcano" icon={<WarningOutlined />}>
                INSUFFICIENT STOCK
              </Tag>
            );

          case "LOW_STOCK":
            return (
              <Tag color="orange" icon={<WarningOutlined />}>
                LOW STOCK
              </Tag>
            );

          case "NOT_FOUND":
            return (
              <Tag color="red" icon={<DatabaseOutlined />}>
                NOT IN INVENTORY
              </Tag>
            );

          case "UNKNOWN":
            return <Tag color="default">INVENTORY UNKNOWN</Tag>;

          default:
            return (
              <Tag color="green" icon={<CheckCircleOutlined />}>
                AVAILABLE
              </Tag>
            );
        }
      },
    },
  ];

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <Modal
      title={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <WarningOutlined
            style={{
              color: "#fa8c16",
            }}
          />

          <span>Inventory / Low Stock Check</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1150}
      destroyOnClose
    >
      {/* ======================================================
          LOADING
          ====================================================== */}

      {isLoadingInventory ? (
        <div
          style={{
            minHeight: 220,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Spin size="large" />
        </div>
      ) : isInventoryError ? (
        /* ====================================================
           ERROR
           ==================================================== */

        <Alert
          type="error"
          showIcon
          message="Failed to load inventory information"
          description={
            inventoryError?.data?.message ||
            inventoryError?.message ||
            "Unable to retrieve inventory information."
          }
          action={
            <button
              type="button"
              onClick={handleRefresh}
              style={{
                border: 0,
                background: "transparent",
                cursor: "pointer",
                color: "#1677ff",
              }}
            >
              Retry
            </button>
          }
        />
      ) : !orderId && incomingProducts.length === 0 ? (
        /* ====================================================
           NO PRODUCTS
           ==================================================== */

        <Empty
          image={
            <DatabaseOutlined
              style={{
                fontSize: 52,
                color: "#bfbfbf",
              }}
            />
          }
          description={
            <div>
              <Text strong>No products selected</Text>

              <br />

              <Text type="secondary">
                Add products to the order before checking inventory.
              </Text>
            </div>
          }
        />
      ) : attentionProducts.length === 0 ? (
        /* ====================================================
           NO ISSUES
           ==================================================== */

        <Empty
          image={
            <CheckCircleOutlined
              style={{
                fontSize: 52,
                color: "#52c41a",
              }}
            />
          }
          description={
            <div>
              <Text strong>No inventory issues found</Text>

              <br />

              <Text type="secondary">
                All products currently have sufficient inventory.
              </Text>
            </div>
          }
        />
      ) : (
        <>
          {/* ==================================================
              SUMMARY
              ================================================== */}

          <Alert
            type="warning"
            showIcon
            icon={<WarningOutlined />}
            message={
              <Space>
                <span>
                  {attentionProducts.length} product
                  {attentionProducts.length === 1 ? "" : "s"} require attention
                </span>
              </Space>
            }
            description={
              orderId
                ? "These products are currently low in stock, out of stock, or insufficient for the order quantity."
                : "This order has not been created yet. Inventory is being checked against the products currently selected in the order."
            }
            style={{
              marginBottom: 16,
            }}
          />

          {/* ==================================================
              TABLE
              ================================================== */}

          <Table
            rowKey={(record, index) => getProductId(record) || index}
            columns={columns}
            dataSource={attentionProducts}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50],
              showTotal: (total) => `${total} products`,
            }}
            scroll={{
              x: 1000,
            }}
            size="small"
            bordered
          />
        </>
      )}
    </Modal>
  );
};

export default LowStockProductsModal;
