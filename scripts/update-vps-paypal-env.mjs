import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Client } from "ssh2";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i === -1) continue;
    const key = trimmed.slice(0, i).trim();
    let val = trimmed.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

function exec(conn, command) {
  return new Promise((resolve, reject) => {
    conn.exec(command, (err, stream) => {
      if (err) return reject(err);
      stream
        .on("close", (code) => (code === 0 ? resolve() : reject(new Error(`exit ${code}`))))
        .on("data", (d) => process.stdout.write(d))
        .stderr.on("data", (d) => process.stderr.write(d));
    });
  });
}

const deploy = loadEnvFile(path.join(root, "scripts", ".deploy.local"));
const appEnv = loadEnvFile(path.join(root, ".env"));

const CLIENT_ID = appEnv.PAYPAL_CLIENT_ID;
const CLIENT_SECRET = appEnv.PAYPAL_CLIENT_SECRET;
const PAYPAL_ENV = appEnv.PAYPAL_ENV || "live";
const WEBHOOK_ID = appEnv.PAYPAL_WEBHOOK_ID || "";
const RESEND_API_KEY = appEnv.RESEND_API_KEY || "";
const EMAIL_FROM = appEnv.EMAIL_FROM || "Misión Comparte <notificaciones@manizalescomparte.com>";
const EMAIL_ADMIN_NOTIFY = appEnv.EMAIL_ADMIN_NOTIFY || "manizalescomparte@gmail.com";
const SITE_URL = appEnv.NEXT_PUBLIC_SITE_URL?.startsWith("http://localhost")
  ? "https://mision.manizalescomparte.com"
  : appEnv.NEXT_PUBLIC_SITE_URL || "https://mision.manizalescomparte.com";
const BOLD_IDENTITY_KEY = appEnv.BOLD_IDENTITY_KEY || "";
const BOLD_SECRET_KEY = appEnv.BOLD_SECRET_KEY || "";
const NEXT_PUBLIC_BOLD_IDENTITY_KEY = BOLD_IDENTITY_KEY;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Faltan PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET en .env local");
  process.exit(1);
}

const patchCmd = `
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
cd ~/mision-manizales-src
python3 - <<'PY'
from pathlib import Path
import re

path = Path(".env")
text = path.read_text() if path.exists() else ""
updates = {
    "PAYPAL_ENV": "${PAYPAL_ENV}",
    "PAYPAL_CLIENT_ID": "${CLIENT_ID}",
    "PAYPAL_CLIENT_SECRET": "${CLIENT_SECRET}",
    "NEXT_PUBLIC_PAYPAL_CLIENT_ID": "${CLIENT_ID}",
    "PAYPAL_WEBHOOK_ID": "${WEBHOOK_ID}",
    "RESEND_API_KEY": "${RESEND_API_KEY}",
    "EMAIL_FROM": "${EMAIL_FROM}",
    "EMAIL_ADMIN_NOTIFY": "${EMAIL_ADMIN_NOTIFY}",
    "NEXT_PUBLIC_SITE_URL": "${SITE_URL}",
    "BOLD_IDENTITY_KEY": "${BOLD_IDENTITY_KEY}",
    "BOLD_SECRET_KEY": "${BOLD_SECRET_KEY}",
    "NEXT_PUBLIC_BOLD_IDENTITY_KEY": "${NEXT_PUBLIC_BOLD_IDENTITY_KEY}",
}
for key, val in updates.items():
    line = f'{key}="{val}"'
    if re.search(rf"^{re.escape(key)}=", text, flags=re.M):
        text = re.sub(rf"^{re.escape(key)}=.*$", line, text, flags=re.M)
    else:
        text = text.rstrip() + "\\n" + line + "\\n"
path.write_text(text)
print("PayPal + email env actualizado en VPS")
PY
if [ -d .next/standalone ]; then cp .env .next/standalone/.env; fi
pm2 delete mision-manizales 2>/dev/null || true
pm2 start scripts/ecosystem.config.js
pm2 save
sleep 2
curl -sf http://127.0.0.1:8010/api/health && echo ""
`.trim();

const conn = new Client();
conn
  .on("ready", async () => {
    try {
      console.log("Actualizando PayPal + email env + reiniciando PM2 en VPS...\n");
      await exec(conn, patchCmd);
      console.log("\nListo.");
      conn.end();
    } catch {
      conn.end();
      process.exit(1);
    }
  })
  .on("error", (err) => {
    console.error(err.message);
    process.exit(1);
  })
  .connect({
    host: deploy.VPS_HOST,
    username: deploy.VPS_USER,
    password: deploy.VPS_PASSWORD,
    readyTimeout: 30000,
  });
