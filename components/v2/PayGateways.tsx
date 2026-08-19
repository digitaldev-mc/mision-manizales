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
            <span className="pgw-icon pgw-icon-logo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/paypal-logo-png-2.png" alt="PayPal" />
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
            <span className="pgw-icon pgw-icon-logo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/bold-logo.png" alt="Bold" />
            </span>
            <span className="pgw-name">Bold</span>
          </div>
          <p className="pgw-desc">PSE, tarjeta o Nequi.</p>
        </button>
      </div>
      <input type="hidden" name="paymentMethod" value={value === "bold" ? "pse" : "paypal"} />
    </>
  );
}
