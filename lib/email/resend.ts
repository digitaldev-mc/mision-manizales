import { Resend } from "resend";

let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY not configured");
    resend = new Resend(key);
  }
  return resend;
}

export async function sendDonationConfirmedEmail(input: {
  to: string;
  fullName: string;
  amountCOP: number;
  referenceCode: string;
}) {
  const from = process.env.EMAIL_FROM ?? "Misión Manizales <notificaciones@manizalescomparte.com>";
  await getResend().emails.send({
    from,
    to: input.to,
    subject: "Gracias por tu donación — Misión Manizales",
    html: `
      <p>Hola ${input.fullName},</p>
      <p>Confirmamos tu donación de <strong>$${input.amountCOP.toLocaleString("es-CO")} COP</strong>.</p>
      <p>Referencia: <strong>${input.referenceCode}</strong></p>
      <p>Gracias por apoyar a Manizales.</p>
    `,
  });
}

export async function sendAdminDonationNotify(input: {
  fullName: string;
  amountCOP: number;
  referenceCode: string;
  paymentMethod: string;
}) {
  const adminEmail = process.env.EMAIL_ADMIN_NOTIFY;
  if (!adminEmail) return;

  const from = process.env.EMAIL_FROM ?? "Misión Manizales <notificaciones@manizalescomparte.com>";
  await getResend().emails.send({
    from,
    to: adminEmail,
    subject: `Nueva donación confirmada — ${input.referenceCode}`,
    html: `
      <p>Donación confirmada.</p>
      <ul>
        <li>Donante: ${input.fullName}</li>
        <li>Monto: $${input.amountCOP.toLocaleString("es-CO")} COP</li>
        <li>Referencia: ${input.referenceCode}</li>
        <li>Método: ${input.paymentMethod}</li>
      </ul>
    `,
  });
}
