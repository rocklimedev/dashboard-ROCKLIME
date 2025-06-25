import React, { useMemo } from "react";
import { Badge, Button, Modal, Space, Typography, Divider } from "antd";
import { ShoppingCartOutlined, DeleteOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { useGetCartQuery, useRemoveFromCartMutation } from "../../api/cartApi";
import { useGetProfileQuery } from "../../api/userApi";
import { toast } from "sonner";

const { Text } = Typography;

const FloatingCart = () => {
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

  const [removeFromCart] = useRemoveFromCartMutation();

  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const cartItems = useMemo(
    () => (Array.isArray(cartData?.cart?.items) ? cartData.cart.items : []),
    [cartData]
  );

  const totalItems = cartItems.reduce(
    (sum, item) => sum + (item.quantity || 0),
    0
  );

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

  if (profileLoading || cartLoading) {
    return null; // Don't render while loading
  }

  if (profileError || cartError) {
    return null; // Silently fail, as this is a floating button
  }

  return (
    <>
      <div className="floating-cart">
        <Badge count={totalItems} style={{ backgroundColor: "#ff4d4f" }}>
          <Button
            type="primary"
            icon={<ShoppingCartOutlined />}
            onClick={() => setIsModalOpen(true)}
          >
            {totalItems}
          </Button>
        </Badge>
      </div>
      <Modal
        title={
          <Space>
            <ShoppingCartOutlined />
            <Text strong>Your Cart ({totalItems} items)</Text>
          </Space>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        className="cart-modal"
      >
        {cartItems.length === 0 ? (
          <Text type="secondary">Your cart is empty</Text>
        ) : (
          <div className="cart-modal-content">
            {cartItems.map((item) => (
              <div key={item.productId} className="cart-modal-item">
                <Space direction="vertical" style={{ flex: 1 }}>
                  <Text strong>{item.name}</Text>
                  <Text type="secondary">Qty: {item.quantity}</Text>
                  <Text>₹{(item.price * item.quantity).toFixed(2)}</Text>
                </Space>
                <Button
                  type="link"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoveItem(item.productId)}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Divider />
            <Link to="/cart">
              <Button
                type="primary"
                block
                onClick={() => setIsModalOpen(false)}
              >
                View Cart
              </Button>
            </Link>
          </div>
        )}
      </Modal>
    </>
  );
};

export default FloatingCart;
