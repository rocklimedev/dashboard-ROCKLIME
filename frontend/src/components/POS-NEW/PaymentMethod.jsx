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

const PaymentMethod = ({ subTotal }) => {
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
    <div class="block-section payment-method">
      <h5 class="mb-2">Select Payment</h5>
      <div class="row align-items-center justify-content-center methods g-2 mb-4">
        {methods.map(({ icon, label, target }, index) => (
          <div key={index} class="col-sm-6 col-md-4 col-xl d-flex">
            <a
              href="javascript:void(0);"
              class="payment-item flex-fill"
              data-bs-toggle="modal"
              data-bs-target="#payment-cash"
            >
              {icon}
              <p class="fw-medium">{label}</p>
            </a>
          </div>
        ))}
      </div>
      <div class="btn-block m-0">
        <a class="btn btn-teal w-100" href="javascript:void(0);">
          {subTotal}
        </a>
      </div>
    </div>
  );
};

export default PaymentMethod;
