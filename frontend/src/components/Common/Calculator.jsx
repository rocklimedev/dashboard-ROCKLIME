import React, { useState } from "react";
import { Modal, Button, Container, Row, Col } from "react-bootstrap";
import "./calculator.css";

const CalculatorModal = ({ show, onClose }) => {
  const [input, setInput] = useState("0");

  const dis = (value) => {
    setInput((prev) => (prev === "0" ? value : prev + value));
  };

  const clr = () => {
    setInput("0");
  };

  const back = () => {
    setInput((prev) => (prev.length > 1 ? prev.slice(0, -1) : "0"));
  };

  const solve = () => {
    try {
      setInput(eval(input.replace(/x/g, "*").replace(/÷/g, "/")).toString());
    } catch {
      setInput("Error");
    }
  };

  const buttons = [
    ["C", "7", "4", "1", ","],
    ["÷", "8", "5", "2", "00"],
    ["%", "9", "6", "3", "."],
    ["←", "x", "-", "+", "="],
  ];

  return (
    <div className="modal fade show" style={{ display: "block" }}>
      <div className="modal-dialog modal-md modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-body p-0">
            <div className="calculator-wrap">
              <div className="p-3">
                <div className="d-flex align-items-center justify-content-between">
                  <h3>Calculator</h3>
                  <button type="button" className="close" onClick={onClose}>
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
                <div>
                  <input className="input" type="text" value={input} readOnly />
                </div>
              </div>
              <Container>
                <Row>
                  {buttons.flat().map((val, i) => (
                    <Col xs={2} className="p-1" key={i}>
                      <Button
                        variant={
                          val === "="
                            ? "primary"
                            : val === "C"
                            ? "danger"
                            : val === "←"
                            ? "warning"
                            : "light"
                        }
                        className="w-100 calc-btn"
                        onClick={() => {
                          if (val === "C") clr();
                          else if (val === "←") back();
                          else if (val === "=") solve();
                          else dis(val);
                        }}
                      >
                        {val}
                      </Button>
                    </Col>
                  ))}
                </Row>
              </Container>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalculatorModal;
