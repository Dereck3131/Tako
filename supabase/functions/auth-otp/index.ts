import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateSixDigitCode(): string {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return String(100000 + (arr[0] % 900000));
}

const LOGO_URL = "https://jdwoszkyonkzxhgzfgnb.supabase.co/functions/v1/auth-otp?asset=tako-mascot.png";
const LOGO_B64 = "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";

function buildVerificationEmailHtml(code: string, purpose: "signup" | "reset"): string {
  const isReset = purpose === "reset";
  const badge = isReset ? "Password Reset" : "Email Verification";
  const heading = isReset ? "Reset your Tako password" : "Verify your Tako account";
  const subtitle = isReset
    ? "Enter this 6-digit code in the app to choose a new password:"
    : "Enter this 6-digit code in the app to finish creating your account:";

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${heading}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&display=swap');
    </style>
  </head>
  <body style="margin: 0; padding: 0; background-color: #F3F1E9; font-family: 'Nunito', 'Trebuchet MS', 'Segoe UI', system-ui, -apple-system, sans-serif; color: #2B2B2B;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F3F1E9; padding: 32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 460px; background-color: #FFFFFF; border: 1px solid #E5E1D5; border-radius: 24px; overflow: hidden;">
            <!-- Coral accent top bar -->
            <tr>
              <td style="height: 6px; background-color: #FF7A8A; font-size: 0; line-height: 0;">&nbsp;</td>
            </tr>
            <!-- Tako Deep Plum Header -->
            <tr>
              <td align="center" style="background-color: #2B1B3D; padding: 28px 24px 24px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="center"><img src="${LOGO_URL}" width="96" height="88" alt="Tako" style="display: block; width: 96px; height: 88px; border: 0;" /></td>
                  </tr>
                </table>
                <div style="margin-top: 12px; font-size: 28px; font-weight: 900; letter-spacing: -0.5px; color: #FFFFFF; line-height: 1.1;">
                  tako
                </div>
                <div style="margin-top: 4px; font-size: 13px; font-weight: 700; color: #B9A5E8;">
                  Split the bill. Keep the friends.
                </div>
              </td>
            </tr>
            <!-- Main Body -->
            <tr>
              <td style="padding: 28px 28px 24px; background-color: #FFFFFF;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 14px;">
                  <tr>
                    <td style="background-color: #E8F8F6; color: #148C80; font-size: 11px; font-weight: 800; letter-spacing: 0.8px; text-transform: uppercase; padding: 5px 12px; border-radius: 999px;">
                      ${badge}
                    </td>
                  </tr>
                </table>
                <h1 style="margin: 0 0 8px; font-size: 22px; font-weight: 900; color: #2B1B3D; line-height: 1.25;">
                  ${heading}
                </h1>
                <p style="margin: 0 0 22px; font-size: 15px; font-weight: 600; color: #6A6A6A; line-height: 1.55;">
                  ${subtitle}
                </p>
                <!-- 6-Digit Code Card -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="center" style="background-color: #FAFAF7; border: 2px solid #E5E1D5; border-radius: 16px; padding: 18px 16px;">
                      <div style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #D92D4B; line-height: 1.15; font-variant-numeric: tabular-nums;">
                        ${code}
                      </div>
                    </td>
                  </tr>
                </table>
                <!-- Expiry & Note -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px;">
                  <tr>
                    <td style="font-size: 13px; font-weight: 600; color: #6A6A6A; line-height: 1.5;">
                      This code expires in <strong style="color: #2B1B3D;">10 minutes</strong>. If you didn&rsquo;t request this, you can safely ignore this email.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td align="center" style="background-color: #FAFAF7; border-top: 1px solid #E5E1D5; padding: 16px 24px;">
                <div style="font-size: 12px; font-weight: 700; color: #6A6A6A;">
                  <span style="color: #2B1B3D; font-weight: 900;">tako</span> &middot; Split the bill. Keep the friends.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function isStrongPassword(password: string): boolean {
  return (
    password.length >= 8 &&
    password.length <= 72 &&
    /[a-zA-Z]/.test(password) &&
    /\d/.test(password)
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method === "GET") {
    const asset = new URL(req.url).searchParams.get("asset");
    if (asset === "tako-mascot.png" || asset === "logo.png") {
      const bytes = Uint8Array.from(atob(LOGO_B64), (c) => c.charCodeAt(0));
      return new Response(bytes, {
        headers: { ...corsHeaders, "Content-Type": "image/png", "Cache-Control": "public, max-age=86400" },
      });
    }
    return new Response("Not found", { status: 404 });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const brevoApiKey = Deno.env.get("BREVO_API_KEY") ?? "";
    const senderEmail =
      Deno.env.get("BREVO_SENDER_EMAIL") || Deno.env.get("BREVO_SMTP_USER") || "";

    if (!supabaseUrl || !serviceKey) {
      return json({ error: "Server configuration missing." }, 500);
    }
    if (!brevoApiKey || !senderEmail) {
      return json(
        {
          error:
            "Add BREVO_API_KEY and BREVO_SENDER_EMAIL in Tako's Supabase Edge Function Secrets.",
        },
        500
      );
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "");
    const email = String(body.email ?? "").trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return json({ error: "Enter a valid email address." }, 400);
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    if (action === "send" || action === "send_reset") {
      const purpose = action === "send_reset" ? "reset" : "signup";
      const startedAt = Date.now();

      const { data: existing } = await admin
        .from("email_verification_codes")
        .select("last_sent_at")
        .eq("email", email)
        .maybeSingle();

      if (existing?.last_sent_at) {
        const elapsedSec = Math.floor(
          (Date.now() - new Date(existing.last_sent_at).getTime()) / 1000
        );
        if (elapsedSec < 60) {
          return json(
            {
              error: `Wait ${60 - elapsedSec}s before requesting another code.`,
              retryAfterSeconds: 60 - elapsedSec,
            },
            429
          );
        }
      }

      if (purpose === "reset") {
        const { data: userId, error: lookupErr } = await admin.rpc(
          "get_auth_user_id_by_email",
          { p_email: email }
        );
        if (lookupErr) {
          console.error("User lookup failed");
          return json({ error: "Could not process password reset." }, 500);
        }

        const code = generateSixDigitCode();
        const codeHash = await sha256Hex(`reset:${email}:${code}`);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

        // Always record cooldown row (even if user doesn't exist) to prevent rate-limit enumeration
        await admin
          .from("email_verification_codes")
          .upsert(
            {
              email,
              code_hash: userId ? codeHash : "non_existent_account",
              expires_at: expiresAt,
              attempts: 0,
              last_sent_at: new Date().toISOString(),
            },
            { onConflict: "email" }
          );

        if (!userId) {
          // Pad response timing so non-existent email matches email send latency
          const elapsed = Date.now() - startedAt;
          const targetMs = 420 + Math.floor(Math.random() * 80);
          if (elapsed < targetMs) {
            await new Promise((r) => setTimeout(r, targetMs - elapsed));
          }
          return json({ ok: true });
        }

        const subject = `Your Tako password reset code: ${code}`;
        const textContent = `Your Tako password reset code is ${code}. It expires in 10 minutes.`;

        const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            accept: "application/json",
            "content-type": "application/json",
            "api-key": brevoApiKey,
          },
          body: JSON.stringify({
            sender: { name: "Tako", email: senderEmail },
            to: [{ email }],
            subject,
            textContent,
            htmlContent: buildVerificationEmailHtml(code, "reset"),
          }),
        });

        if (!brevoRes.ok) {
          console.error("Brevo API error:", brevoRes.status);
          return json({ error: "Could not send reset code. Please try again." }, 502);
        }

        return json({ ok: true });
      }

      const code = generateSixDigitCode();
      const hashInput = `${email}:${code}`;
      const codeHash = await sha256Hex(hashInput);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      const { error: upsertErr } = await admin
        .from("email_verification_codes")
        .upsert(
          {
            email,
            code_hash: codeHash,
            expires_at: expiresAt,
            attempts: 0,
            last_sent_at: new Date().toISOString(),
          },
          { onConflict: "email" }
        );

      if (upsertErr) {
        console.error("Upsert verification code failed");
        return json({ error: "Could not save verification code." }, 500);
      }

      const subject = `Your Tako verification code: ${code}`;
      const textContent = `Your Tako verification code is ${code}. It expires in 10 minutes.`;

      const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "api-key": brevoApiKey,
        },
        body: JSON.stringify({
          sender: { name: "Tako", email: senderEmail },
          to: [{ email }],
          subject,
          textContent,
          htmlContent: buildVerificationEmailHtml(code, "signup"),
        }),
      });

      if (!brevoRes.ok) {
        console.error("Brevo API error:", brevoRes.status);
        return json({ error: "Could not send verification code. Please try again." }, 502);
      }

      return json({ ok: true });
    }

    if (action === "verify_reset_code") {
      const code = String(body.code ?? "").trim();
      if (!/^\d{6}$/.test(code)) {
        return json({ error: "Enter the 6-digit reset code." }, 400);
      }

      const { data: row } = await admin
        .from("email_verification_codes")
        .select("*")
        .eq("email", email)
        .maybeSingle();

      if (!row) {
        return json({ error: "That code didn't work. Check your email and try again." }, 400);
      }
      if (new Date(row.expires_at).getTime() < Date.now()) {
        return json({ error: "This code has expired. Tap \"Resend code\" for a new one." }, 400);
      }
      if (row.attempts >= 5) {
        return json({ error: "Too many incorrect attempts. Request a new code to continue." }, 429);
      }

      const expectedHash = await sha256Hex(`reset:${email}:${code}`);
      if (expectedHash !== row.code_hash) {
        await admin
          .from("email_verification_codes")
          .update({ attempts: row.attempts + 1 })
          .eq("email", email);
        return json({ error: "That code didn't work. Check your email and try again." }, 400);
      }

      return json({ ok: true });
    }

    if (action === "verify" || action === "verify_reset") {
      const isReset = action === "verify_reset";
      const code = String(body.code ?? "").trim();
      const password = String(body.password ?? "");

      if (!/^\d{6}$/.test(code)) {
        return json({ error: "Enter the 6-digit reset code." }, 400);
      }
      if (!isStrongPassword(password)) {
        return json({ error: "Use 8+ characters with at least one letter and one number." }, 400);
      }

      let displayName = "";
      if (!isReset) {
        displayName = String(body.displayName ?? "")
          .replace(/[\u0000-\u001F\u007F]/g, "")
          .replace(/\s+/g, " ")
          .trim();
        if (!displayName || displayName.length > 30) {
          return json({ error: "Display name must be 1–30 characters." }, 400);
        }
      }

      const { data: row } = await admin
        .from("email_verification_codes")
        .select("*")
        .eq("email", email)
        .maybeSingle();

      if (!row) {
        return json({ error: "That code didn't work. Check your email and try again." }, 400);
      }

      if (new Date(row.expires_at).getTime() < Date.now()) {
        return json({ error: "This code has expired. Tap \"Resend code\" for a new one." }, 400);
      }

      if (row.attempts >= 5) {
        return json({ error: "Too many incorrect attempts. Request a new code to continue." }, 429);
      }

      const hashInput = isReset ? `reset:${email}:${code}` : `${email}:${code}`;
      const expectedHash = await sha256Hex(hashInput);
      if (expectedHash !== row.code_hash) {
        await admin
          .from("email_verification_codes")
          .update({ attempts: row.attempts + 1 })
          .eq("email", email);
        return json({ error: "That code didn't work. Check your email and try again." }, 400);
      }

      if (isReset) {
        const { data: userId, error: lookupErr } = await admin.rpc(
          "get_auth_user_id_by_email",
          { p_email: email }
        );
        if (lookupErr || !userId) {
          return json({ error: "That code didn't work. Check your email and try again." }, 400);
        }

        // Check if the new password is the same as the current password
        const anonClient = createClient(supabaseUrl, serviceKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
        const { data: sameCheck } = await anonClient.auth.signInWithPassword({
          email,
          password,
        });
        if (sameCheck?.user) {
          await anonClient.auth.signOut().catch(() => {});
          return json(
            { error: "New password must be different from your current password." },
            400
          );
        }

        const { error: updateErr } = await admin.auth.admin.updateUserById(userId, {
          password,
          email_confirm: true,
        });
        if (updateErr) {
          return json({ error: updateErr.message }, 400);
        }

        await admin.from("email_verification_codes").delete().eq("email", email);
        return json({ ok: true });
      }

      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { display_name: displayName },
      });

      if (createErr) {
        const msg = createErr.message.toLowerCase();
        if (msg.includes("already") || msg.includes("registered")) {
          return json({ error: "An account with this email already exists." }, 409);
        }
        return json({ error: createErr.message }, 400);
      }

      await admin.from("email_verification_codes").delete().eq("email", email);
      return json({ ok: true, userId: created.user?.id });
    }

    return json({ error: "Unsupported action." }, 400);
  } catch (err) {
    console.error("auth-otp error:", err);
    return json({ error: err instanceof Error ? err.message : "Unexpected error." }, 500);
  }
});
