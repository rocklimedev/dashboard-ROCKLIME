import React from "react";
import { Button, Space, Card } from "antd";
import {
  FaMoneyBillAlt, // Cash
  FaCreditCard, // Card
  FaStar, // Points
  FaUniversity, // Deposit
  FaRegFileAlt, // Cheque
  FaGift, // Gift Card
  FaQrcode, // Scan
  FaClock, // Pay Later
  FaExternalLinkAlt, // External
  FaEquals, // Split Bill
} from "react-icons/fa";
import styled from "styled-components";
import PropTypes from "prop-types";

const PaymentButton = styled(Button)`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 50px;
  width: 100%;
  margin-bottom: 8px;
  font-size: 16px;
  .anticon {
    margin-right: 8px;
  }
`;

const PaymentMethod = ({ subTotal, selectedMethod, onSelectMethod }) => {
  const methods = [
    { icon: <FaMoneyBillAlt />, label: "Cash" },
    { icon: <FaUniversity />, label: "Deposit" },
    { icon: <FaRegFileAlt />, label: "Cheque" },
    { icon: <FaQrcode />, label: "Scan" },
    { icon: <FaEquals />, label: "Split Bill" },
  ];

  return (
    <Card title="Select Payment Method" bordered={false}>
      <Space direction="vertical" style={{ width: "100%" }} size="small">
        {methods.map(({ icon, label }, index) => (
          <PaymentButton
            key={index}
            type={selectedMethod === label ? "primary" : "default"}
            onClick={() => onSelectMethod(label)}
            icon={icon}
            aria-label={`Select ${label} payment method`}
          >
            {label}
          </PaymentButton>
        ))}
        <PaymentButton type="primary" disabled>
          Total: ₹{subTotal.toFixed(2)}
        </PaymentButton>
      </Space>
    </Card>
  );
};

PaymentMethod.propTypes = {
  subTotal: PropTypes.number.isRequired,
  selectedMethod: PropTypes.string,
  onSelectMethod: PropTypes.func.isRequired,
};

PaymentMethod.defaultProps = {
  selectedMethod: "Cash",
};

export default PaymentMethod;
