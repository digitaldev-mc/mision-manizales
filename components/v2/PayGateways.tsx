"use client";

type PayMethod = "paypal" | "bold";

type PayGatewaysProps = {
  value: PayMethod;
  onChange: (method: PayMethod) => void;
};

export function PayGateways({ value, onChange }: PayGatewaysProps) {
  return (
    <>
      <label
        style={{
          fontSize: ".82rem",
          fontWeight: 700,
          color: "#3c4b5a",
          display: "block",
          marginBottom: 10,
        }}
      >
        Pasarela de pago
      </label>
      <div className="pay-gateways" id="pay-gateways">
        <button
          type="button"
          className={`pay-gateway pgw-paypal${value === "paypal" ? " active" : ""}`}
          data-pay="paypal"
          onClick={() => onChange("paypal")}
        >
          <div className="pgw-check">✓</div>
          <div className="pgw-top">
            <span className="pgw-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 4h9a4 4 0 0 1 0 8H9l-1 8H4l3-16Z" />
                <path d="M11 8h6a3.5 3.5 0 0 1 0 7h-4" />
              </svg>
            </span>
            <span className="pgw-name">PayPal</span>
          </div>
          <p className="pgw-desc">Pago internacional seguro.</p>
        </button>
        <button
          type="button"
          className={`pay-gateway pgw-bold${value === "bold" ? " active" : ""}`}
          data-pay="bold"
          onClick={() => onChange("bold")}
        >
          <div className="pgw-check">✓</div>
          <div className="pgw-top">
            <span className="pgw-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 2 3 14h7l-1 8 11-14h-8l1-6Z" />
              </svg>
            </span>
            <span className="pgw-name">Bold</span>
          </div>
          <p className="pgw-desc">PSE, tarjeta o Nequi.</p>
        </button>
      </div>
      <input type="hidden" name="paymentMethod" value={value === "bold" ? "transferencia" : "paypal"} />
    </>
  );
}
