import React, { useMemo, useState, useRef, useEffect } from "react";
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

  const [isModalOpen, setIsModalOpen] = useState(false);
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

  // Dragging state
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [dragging, setDragging] = useState(false);
  const offsetRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    setDragging(true);
    offsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;
    setPosition({
      x: e.clientX - offsetRef.current.x,
      y: e.clientY - offsetRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging]);

  if (profileLoading || cartLoading) {
    return null;
  }
  if (profileError || cartError) {
    return null;
  }

  return (
    <>
      <div
        className="floating-cart"
        style={{
          position: "fixed",
          left: position.x,
          top: position.y,
          zIndex: 1000,
          cursor: "grab",
        }}
        onMouseDown={handleMouseDown}
      >
        <Badge count={totalItems} style={{ backgroundColor: "#ff4d4f" }}>
          <Button
            style={{ color: "grey" }}
            icon={<ShoppingCartOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              setIsModalOpen(true);
            }}
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
