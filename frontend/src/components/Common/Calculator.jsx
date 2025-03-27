import React, { useState } from "react";

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
      setInput(eval(input).toString());
    } catch {
      setInput("Error");
    }
  };

  return (
    <div
      className={`modal fade pos-modal ${show ? "show d-block" : ""}`}
      style={{ display: "block" }}
    >
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
              <div className="calculator-body d-flex justify-content-between">
                {["C", "7", "4", "1", ","].map((val) => (
                  <button
                    key={val}
                    className="btn"
                    onClick={() => (val === "C" ? clr() : dis(val))}
                  >
                    {val}
                  </button>
                ))}
                {["÷", "8", "5", "2", "00"].map((val) => (
                  <button key={val} className="btn" onClick={() => dis(val)}>
                    {val}
                  </button>
                ))}
                {["%", "9", "6", "3", "."].map((val) => (
                  <button key={val} className="btn" onClick={() => dis(val)}>
                    {val}
                  </button>
                ))}
                {["←", "x", "-", "+", "="].map((val) => (
                  <button
                    key={val}
                    className="btn"
                    onClick={() =>
                      val === "←" ? back() : val === "=" ? solve() : dis(val)
                    }
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalculatorModal;
