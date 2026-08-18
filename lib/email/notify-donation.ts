import { Resend } from "resend";
import { decryptPII } from "@/lib/crypto";

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

function brandName() {
  return "Misión Manizales";
}

function safeDecrypt(value: string | null | undefined): string {
  if (!value || value === "MANUAL" || value === "N/A") return value ?? "";
  try {
    return decryptPII(value);
  } catch {
    return value;
  }
}

export type DonationMailInput = {
  fullName: string;
  email: string;
  phone?: string;
  documentType?: string;
  documentNumber?: string;
  address?: string;
  amountCOP: number;
  amountOriginal?: number;
  currencyOriginal?: string;
  referenceCode: string;
  paymentMethod: string;
  confirmedAt?: Date;
};

export function donationToMailInput(donation: {
  fullName: string;
  email: string;
  phone: string;
  documentType: string;
  documentNumber: string;
  address: string;
  amountCOP: number;
  amountOriginal: number;
  currencyOriginal: string;
  referenceCode: string;
  paymentMethod: string;
  confirmedAt?: Date | null;
}): DonationMailInput {
  return {
    fullName: donation.fullName,
    email: donation.email,
    phone: safeDecrypt(donation.phone),
    documentType: donation.documentType,
    documentNumber: safeDecrypt(donation.documentNumber),
    address: safeDecrypt(donation.address),
    amountCOP: donation.amountCOP,
    amountOriginal: donation.amountOriginal,
    currencyOriginal: donation.currencyOriginal,
    referenceCode: donation.referenceCode,
    paymentMethod: donation.paymentMethod,
    confirmedAt: donation.confirmedAt ?? undefined,
  };
}

function formatMoney(n: number) {
  return `$${n.toLocaleString("es-CO")}`;
}

function paymentLabel(method: string) {
  const labels: Record<string, string> = {
    paypal: "PayPal",
    transferencia: "Transferencia bancaria",
    pse: "PSE",
  };
  return labels[method] ?? method;
}

function emailShell(title: string, body: string) {
  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#eef3f8;font-family:Georgia,'Times New Roman',serif">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef3f8;padding:32px 16px">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:580px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(30,58,95,0.12)">
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a5f 0%,#2d6a4f 100%);padding:28px 32px;text-align:center">
              <p style="margin:0 0 6px;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.85)">Manizales Comparte</p>
              <h1 style="margin:0;font-size:26px;font-weight:400;color:#ffffff;line-height:1.3">${title}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;color:#1e3a5f;font-size:16px;line-height:1.75">${body}</td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px;text-align:center">
              <a href="${siteUrl()}" style="display:inline-block;padding:12px 28px;background:#2d6a4f;color:#ffffff;text-decoration:none;border-radius:999px;font-size:14px;letter-spacing:0.04em">Visitar ${brandName()}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:#f7f9fb;border-top:1px solid #e4eaf0;text-align:center;font-size:12px;color:#7a8896;line-height:1.6">
              ${brandName()} · <a href="${siteUrl()}" style="color:#2d6a4f;text-decoration:none">mision.manizalescomparte.com</a><br/>
              Este correo fue enviado por Manizales Comparte.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function htmlTeam(d: DonationMailInput) {
  const confirmedLine = d.confirmedAt
    ? `<tr><td style="padding:10px 0;border-bottom:1px solid #e4eaf0;color:#7a8896;width:38%">Confirmada</td><td style="padding:10px 0;border-bottom:1px solid #e4eaf0">${d.confirmedAt.toLocaleString("es-CO")}</td></tr>`
    : "";

  const originalAmount =
    d.currencyOriginal && d.currencyOriginal !== "COP" && d.amountOriginal
      ? `<tr><td style="padding:10px 0;border-bottom:1px solid #e4eaf0;color:#7a8896">Monto original</td><td style="padding:10px 0;border-bottom:1px solid #e4eaf0">${formatMoney(d.amountOriginal)} ${d.currencyOriginal}</td></tr>`
      : "";

  const body = `
    <p style="margin:0 0 20px;font-size:17px">Se confirmó una nueva donación a <strong>${brandName()}</strong>. A continuación, los datos del donante:</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:15px">
      <tr><td style="padding:10px 0;border-bottom:1px solid #e4eaf0;color:#7a8896;width:38%">Referencia</td><td style="padding:10px 0;border-bottom:1px solid #e4eaf0"><strong>${d.referenceCode}</strong></td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #e4eaf0;color:#7a8896">Nombre completo</td><td style="padding:10px 0;border-bottom:1px solid #e4eaf0">${d.fullName}</td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #e4eaf0;color:#7a8896">Correo</td><td style="padding:10px 0;border-bottom:1px solid #e4eaf0"><a href="mailto:${d.email}" style="color:#2d6a4f">${d.email}</a></td></tr>
      ${d.phone ? `<tr><td style="padding:10px 0;border-bottom:1px solid #e4eaf0;color:#7a8896">Teléfono</td><td style="padding:10px 0;border-bottom:1px solid #e4eaf0">${d.phone}</td></tr>` : ""}
      ${d.documentType && d.documentNumber ? `<tr><td style="padding:10px 0;border-bottom:1px solid #e4eaf0;color:#7a8896">Documento</td><td style="padding:10px 0;border-bottom:1px solid #e4eaf0">${d.documentType} ${d.documentNumber}</td></tr>` : ""}
      ${d.address ? `<tr><td style="padding:10px 0;border-bottom:1px solid #e4eaf0;color:#7a8896">Dirección</td><td style="padding:10px 0;border-bottom:1px solid #e4eaf0">${d.address}</td></tr>` : ""}
      <tr><td style="padding:10px 0;border-bottom:1px solid #e4eaf0;color:#7a8896">Monto (COP)</td><td style="padding:10px 0;border-bottom:1px solid #e4eaf0"><strong>${formatMoney(d.amountCOP)} COP</strong></td></tr>
      ${originalAmount}
      <tr><td style="padding:10px 0;border-bottom:1px solid #e4eaf0;color:#7a8896">Método de pago</td><td style="padding:10px 0;border-bottom:1px solid #e4eaf0">${paymentLabel(d.paymentMethod)}</td></tr>
      ${confirmedLine}
    </table>
    <p style="margin:24px 0 0;font-size:14px;color:#7a8896">Puedes responder a este correo para contactar directamente al donante.</p>
  `;

  return emailShell("Nueva donación confirmada", body);
}

function htmlClient(d: DonationMailInput) {
  const body = `
    <p style="margin:0 0 8px;font-size:18px">Querido/a <strong>${d.fullName}</strong>,</p>
    <p style="margin:0 0 20px">Desde el corazón de Manizales, queremos decirte <strong>¡gracias!</strong> Tu generosidad es un gesto hermoso que enciende esperanza en nuestra ciudad.</p>
    <p style="margin:0 0 20px">Cada aporte — grande o pequeño — se convierte en ladrillo, en abrazo, en futuro. Gracias a personas como tú, seguimos reconstruyendo hogares, restaurando sueños y demostrando que Manizales se levanta unida.</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 24px;background:linear-gradient(135deg,#f0f7f4 0%,#e8f0f8 100%);border-radius:12px;padding:20px 24px">
      <tr>
        <td style="text-align:center">
          <p style="margin:0 0 4px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#2d6a4f">Tu aporte confirmado</p>
          <p style="margin:0;font-size:32px;color:#1e3a5f;font-weight:400">${formatMoney(d.amountCOP)} <span style="font-size:16px">COP</span></p>
          <p style="margin:8px 0 0;font-size:13px;color:#7a8896">Referencia: ${d.referenceCode}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 20px">Tu detalle no pasa desapercibido. Eres parte de una misión que trasciende: la de volver a sembrar confianza, comunidad y vida en cada rincón de nuestra Manizales.</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 8px;border-left:4px solid #2d6a4f;padding-left:16px">
      <tr>
        <td>
          <p style="margin:0 0 6px;font-size:15px;color:#2d6a4f"><strong>Certificado de donación</strong></p>
          <p style="margin:0;font-size:15px;color:#1e3a5f">Tu certificado de donación te estará llegando <strong>a fin de mes</strong> al correo electrónico que registraste. Guárdalo con cariño: es la prueba de que, cuando Manizales más lo necesitaba, tú estuviste ahí.</p>
        </td>
      </tr>
    </table>
    <p style="margin:24px 0 0;font-size:15px;color:#7a8896">Si tienes alguna pregunta, responde a este correo. Estamos contigo.</p>
    <p style="margin:20px 0 0;font-size:16px;color:#1e3a5f">Con gratitud infinita,<br/><strong>El equipo de ${brandName()}</strong></p>
  `;

  return emailShell("Gracias por tu gran detalle", body);
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
  const plainTeam = [
    `Nueva donación confirmada — ${d.referenceCode}`,
    `Donante: ${d.fullName}`,
    `Correo: ${d.email}`,
    d.phone ? `Teléfono: ${d.phone}` : "",
    d.documentType && d.documentNumber ? `Documento: ${d.documentType} ${d.documentNumber}` : "",
    d.address ? `Dirección: ${d.address}` : "",
    `Monto: ${formatMoney(d.amountCOP)} COP`,
    `Método: ${paymentLabel(d.paymentMethod)}`,
  ]
    .filter(Boolean)
    .join("\n");

  const plainClient = [
    `Hola ${d.fullName},`,
    "",
    "¡Gracias por tu gran detalle! Confirmamos tu donación a Misión Manizales.",
    `Monto: ${formatMoney(d.amountCOP)} COP`,
    `Referencia: ${d.referenceCode}`,
    "",
    "Tu certificado de donación te estará llegando a fin de mes al correo que registraste.",
    "",
    siteUrl(),
  ].join("\n");

  const teamOk = await sendHtml({
    to: team,
    subject: `Nueva donación · ${d.fullName} · ${d.referenceCode}`,
    html: htmlTeam(d),
    text: plainTeam,
    replyTo: d.email || undefined,
  });

  let clientOk = true;
  if (d.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email) && !d.email.endsWith("@misionmanizales.org")) {
    clientOk = await sendHtml({
      to: d.email,
      subject: `Gracias por tu donación · ${d.referenceCode} · Misión Manizales`,
      html: htmlClient(d),
      text: plainClient,
      replyTo: team,
    });
  }

  return { teamOk, clientOk };
}
