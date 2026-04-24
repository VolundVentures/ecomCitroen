import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type ConfirmRequest = {
  email: string;
  name: string;
  phone?: string;
  modelName: string;
  trimName: string;
  price: number;
  refNumber: string;
  visitDate: string;
  dealerName: string;
  dealerAddress: string;
  dealerPhone: string;
};

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ConfirmRequest;
  const resendKey = process.env.RESEND_API_KEY;

  if (!resendKey) {
    console.log("[reserve/confirm] RESEND_API_KEY not set — email skipped. Payload:", JSON.stringify(body));
    return NextResponse.json({
      ok: true,
      emailSent: false,
      reason: "RESEND_API_KEY not configured",
    });
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Citroën Maroc <noreply@citroen.ma>",
        to: [body.email],
        subject: `Confirmation de réservation — ${body.modelName} — Réf. ${body.refNumber}`,
        html: buildEmailHtml(body),
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[reserve/confirm] Resend error:", res.status, errText.slice(0, 200));
      return NextResponse.json({ ok: true, emailSent: false, reason: `Resend ${res.status}` });
    }

    return NextResponse.json({ ok: true, emailSent: true });
  } catch (err) {
    console.error("[reserve/confirm] Email error:", err);
    return NextResponse.json({ ok: true, emailSent: false, reason: String(err) });
  }
}

function buildEmailHtml(data: ConfirmRequest): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8f5f0; margin: 0; padding: 40px 20px;">
  <div style="max-width: 580px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
    <div style="background: #121214; padding: 32px; text-align: center;">
      <img src="https://store.citroen.ma/brand/citroen-logo.png" alt="Citroën" width="48" style="margin-bottom: 16px;">
      <h1 style="color: white; font-size: 22px; margin: 0; font-weight: 600;">Réservation confirmée ✓</h1>
      <p style="color: rgba(255,255,255,0.7); font-size: 14px; margin: 8px 0 0;">Réf. ${data.refNumber}</p>
    </div>
    <div style="padding: 32px;">
      <p style="font-size: 15px; color: #121214; margin: 0 0 20px;">
        Bonjour ${data.name},<br><br>
        Votre réservation pour la <strong>${data.modelName} — ${data.trimName}</strong> est confirmée.
        Le concessionnaire vous contactera sous 2 heures.
      </p>

      <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #166534; margin-bottom: 8px;">Rendez-vous prévu</div>
        <div style="font-size: 18px; font-weight: 600; color: #166534;">${data.visitDate}</div>
        <div style="font-size: 14px; color: #15803d; margin-top: 4px;">10h00 — 12h00 (créneau indicatif)</div>
      </div>

      <div style="background: #fafafa; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #71717a; margin-bottom: 12px;">Récapitulatif</div>
        <table style="width: 100%; font-size: 14px; color: #121214;">
          <tr><td style="padding: 4px 0; color: #71717a;">Véhicule</td><td style="padding: 4px 0; text-align: right; font-weight: 600;">${data.modelName}</td></tr>
          <tr><td style="padding: 4px 0; color: #71717a;">Finition</td><td style="padding: 4px 0; text-align: right;">${data.trimName}</td></tr>
          <tr><td style="padding: 4px 0; color: #71717a;">Prix</td><td style="padding: 4px 0; text-align: right; font-weight: 600;">${new Intl.NumberFormat("fr-MA").format(data.price)} MAD</td></tr>
        </table>
      </div>

      <div style="background: #fafafa; border-radius: 12px; padding: 20px;">
        <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #71717a; margin-bottom: 8px;">Concessionnaire</div>
        <div style="font-size: 14px; font-weight: 600; color: #121214;">${data.dealerName}</div>
        <div style="font-size: 13px; color: #71717a; margin-top: 4px;">${data.dealerAddress}</div>
        <div style="font-size: 13px; color: #71717a;">${data.dealerPhone}</div>
      </div>

      <p style="font-size: 12px; color: #a1a1aa; margin: 24px 0 0; text-align: center;">
        L'acompte est remboursable jusqu'à signature du bon de commande.<br>
        © 2026 Stellantis Maroc — Citroën
      </p>
    </div>
  </div>
</body>
</html>`;
}
