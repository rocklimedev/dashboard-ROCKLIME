import React from "react";
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

const PaymentMethod = () => {
  const methods = [
    {
      icon: <FaMoneyBillAlt className="me-2" />,
      label: "Cash",
      target: "#payment-cash",
    },
    {
      icon: <FaCreditCard className="me-2" />,
      label: "Card",
      target: "#payment-card",
    },
    {
      icon: <FaStar className="me-2" />,
      label: "Points",
      target: "#payment-points",
    },
    {
      icon: <FaUniversity className="me-2" />,
      label: "Deposit",
      target: "#payment-deposit",
    },
    {
      icon: <FaRegFileAlt className="me-2" />,
      label: "Cheque",
      target: "#payment-cheque",
    },
    {
      icon: <FaGift className="me-2" />,
      label: "Gift Card",
      target: "#gift-payment",
    },
    {
      icon: <FaQrcode className="me-2" />,
      label: "Scan",
      target: "#scan-payment",
    },
    { icon: <FaClock className="me-2" />, label: "Pay Later" },
    { icon: <FaExternalLinkAlt className="me-2" />, label: "External" },
    {
      icon: <FaEquals className="me-2" />,
      label: "Split Bill",
      target: "#split-payment",
    },
  ];

  return (
    <div className="card payment-method">
      <div className="card-body">
        <h5 className="mb-3">Select Payment</h5>
        <div className="row align-items-center methods g-2">
          {methods.map(({ icon, label, target }, index) => (
            <div key={index} className="col-sm-6 col-md-4 d-flex">
              <a
                href="javascript:void(0);"
                className="payment-item d-flex align-items-center justify-content-center p-2 flex-fill"
              >
                {icon}
                <p className="fs-14 fw-medium">{label}</p>
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PaymentMethod;
