import { Badge, Button } from "antd";
import { Link } from "react-router-dom";
import { ShoppingCartOutlined } from "@ant-design/icons";
const Cart = ({ cartItems, onRemoveFromCart }) => {
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div
      style={{
        position: "fixed",
        top: 16,
        right: 16,
        zIndex: 1000,
        padding: 16,
      }}
    >
      <Badge count={totalItems}>
        <Button type="primary" icon={<ShoppingCartOutlined />}>
          Cart: {totalItems} item{totalItems !== 1 ? "s" : ""}
        </Button>
      </Badge>
      {cartItems.length > 0 && (
        <div
          style={{
            background: "#fff",
            padding: 16,
            border: "1px solid #d9d9d9",
            borderRadius: 4,
            marginTop: 8,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          <h5>Cart</h5>
          {cartItems.map((item) => (
            <div
              key={item.productId}
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <span>
                {item.name} (x{item.quantity})
              </span>
              <Button
                type="link"
                danger
                onClick={() => onRemoveFromCart(item.productId)}
              >
                Remove
              </Button>
            </div>
          ))}
          <Link to="/cart">
            <Button type="primary" block style={{ marginTop: 8 }}>
              View Cart
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};
export default Cart;
