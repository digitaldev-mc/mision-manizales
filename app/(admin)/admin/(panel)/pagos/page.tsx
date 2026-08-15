import { getPagosData, savePagosAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminPagosPage() {
  const pagos = await getPagosData();

  return (
    <div className="admin-panel-card">
      <h2>Medios de pago del sitio</h2>
      <p style={{ color: "#7a8896", fontSize: "0.88rem", marginBottom: 20 }}>
        Estos datos alimentan la sección de donaciones: enlaces PayPal/Bold y datos para transferencia bancaria.
      </p>
      <form action={savePagosAction} className="admin-form-grid">
        <div className="field full">
          <label htmlFor="paypalLink">Enlace PayPal</label>
          <input id="paypalLink" name="paypalLink" defaultValue={pagos.paypalLink} placeholder="https://paypal.me/..." />
        </div>
        <div className="field full">
          <label htmlFor="boldLink">Enlace Bold (transferencia)</label>
          <input id="boldLink" name="boldLink" defaultValue={pagos.boldLink} placeholder="https://..." />
        </div>
        <div className="field">
          <label htmlFor="banco">Banco</label>
          <input id="banco" name="banco" defaultValue={pagos.banco.banco} />
        </div>
        <div className="field">
          <label htmlFor="tipoCuenta">Tipo de cuenta</label>
          <input id="tipoCuenta" name="tipoCuenta" defaultValue={pagos.banco.tipoCuenta} />
        </div>
        <div className="field">
          <label htmlFor="numeroCuenta">Número de cuenta</label>
          <input id="numeroCuenta" name="numeroCuenta" defaultValue={pagos.banco.numeroCuenta} />
        </div>
        <div className="field">
          <label htmlFor="titular">Titular</label>
          <input id="titular" name="titular" defaultValue={pagos.banco.titular} />
        </div>
        <div className="field full">
          <label htmlFor="nit">NIT / identificación</label>
          <input id="nit" name="nit" defaultValue={pagos.banco.nit} />
        </div>
        <div className="full">
          <button type="submit" className="btn btn-primary">
            Guardar medios de pago
          </button>
        </div>
      </form>
    </div>
  );
}
