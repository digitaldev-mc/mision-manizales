import { Resend } from "resend";

let resend: Resend | null = null;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key?.startsWith("re_")) return null;
  if (!resend) resend = new Resend(key);
  return resend;
}

function teamEmail() {
  return process.env.EMAIL_ADMIN_NOTIFY ?? "manizalescomparte@gmail.com";
}

function fromAddress() {
  return process.env.EMAIL_FROM ?? "Misión Manizales <notificaciones@manizalescomparte.com>";
}

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://mision.manizalescomparte.com";
}

type DonationMailInput = {
  fullName: string;
  email: string;
  phone?: string;
  amountCOP: number;
  referenceCode: string;
  paymentMethod: string;
};

function htmlTeam(d: DonationMailInput) {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1e3a5f;max-width:560px">
      <h2 style="margin:0 0 12px">Nueva donación confirmada</h2>
      <p>Se confirmó un aporte a Misión Manizales.</p>
      <ul>
        <li><strong>Referencia:</strong> ${d.referenceCode}</li>
        <li><strong>Donante:</strong> ${d.fullName}</li>
        <li><strong>Correo:</strong> ${d.email}</li>
        ${d.phone ? `<li><strong>Teléfono:</strong> ${d.phone}</li>` : ""}
        <li><strong>Monto:</strong> $${d.amountCOP.toLocaleString("es-CO")} COP</li>
        <li><strong>Método:</strong> ${d.paymentMethod}</li>
      </ul>
      <p><a href="${siteUrl()}/admin/donaciones">Ver en el panel admin</a></p>
    </div>
  `;
}

function htmlClient(d: DonationMailInput) {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1e3a5f;max-width:560px">
      <h2 style="margin:0 0 12px">Gracias por tu donación</h2>
      <p>Hola ${d.fullName},</p>
      <p>Confirmamos tu aporte a <strong>Misión Manizales</strong>.</p>
      <p><strong>Monto:</strong> $${d.amountCOP.toLocaleString("es-CO")} COP<br/>
      <strong>Referencia:</strong> ${d.referenceCode}</p>
      <p>Tu gesto suma a la reconstrucción de Manizales. Si tienes alguna pregunta, responde a este correo.</p>
      <p><a href="${siteUrl()}">Visitar mision.manizalescomparte.com</a></p>
    </div>
  `;
}

async function sendHtml(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}) {
  const client = getResend();
  if (!client) {
    console.warn("RESEND_API_KEY no configurada — correo no enviado:", input.subject);
    return false;
  }

  const { error } = await client.emails.send({
    from: fromAddress(),
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    replyTo: input.replyTo,
  });

  if (error) {
    console.error("Resend error:", error);
    return false;
  }
  return true;
}

/** Dos correos independientes: equipo (Reply-To cliente) + cliente (Reply-To equipo). */
export async function notifyDonationConfirmed(d: DonationMailInput) {
  const team = teamEmail();
  const plainTeam = `Donación confirmada ${d.referenceCode}\nDonante: ${d.fullName}\nMonto: $${d.amountCOP} COP`;
  const plainClient = `Gracias ${d.fullName}. Donación confirmada por $${d.amountCOP} COP. Referencia: ${d.referenceCode}.`;

  const teamOk = await sendHtml({
    to: team,
    subject: `Nueva donación · ${d.fullName} · ${d.referenceCode}`,
    html: htmlTeam(d),
    text: plainTeam,
    replyTo: d.email || undefined,
  });

  let clientOk = true;
  if (d.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) {
    clientOk = await sendHtml({
      to: d.email,
      subject: `Copia de tu donación · ${d.referenceCode} · Misión Manizales`,
      html: htmlClient(d),
      text: plainClient,
      replyTo: team,
    });
  }

  return { teamOk, clientOk };
}
