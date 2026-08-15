import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Client } from "ssh2";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadDeployEnv() {
  const file = path.join(__dirname, ".deploy.local");
  if (!fs.existsSync(file)) {
    throw new Error("Falta scripts/.deploy.local (VPS_HOST, VPS_USER, VPS_PASSWORD)");
  }
  const env = {};
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i === -1) continue;
    env[trimmed.slice(0, i).trim()] = trimmed.slice(i + 1).trim();
  }
  return env;
}

function exec(conn, command) {
  return new Promise((resolve, reject) => {
    conn.exec(command, (err, stream) => {
      if (err) return reject(err);
      let stdout = "";
      let stderr = "";
      stream
        .on("close", (code) => {
          if (code === 0) resolve(stdout);
          else reject(new Error(stderr || stdout || `exit ${code}`));
        })
        .on("data", (d) => {
          const s = d.toString();
          stdout += s;
          process.stdout.write(s);
        })
        .stderr.on("data", (d) => {
          const s = d.toString();
          stderr += s;
          process.stderr.write(s);
        });
    });
  });
}

const deployCmd = `
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
cd ~/mision-manizales-src
git pull origin main
bash scripts/vps-build-restart.sh
`.trim();

const { VPS_HOST, VPS_USER, VPS_PASSWORD } = loadDeployEnv();

const conn = new Client();
conn
  .on("ready", async () => {
    try {
      console.log(`Conectado a ${VPS_USER}@${VPS_HOST}\n`);
      await exec(conn, deployCmd);
      conn.end();
    } catch (e) {
      conn.end();
      process.exit(1);
    }
  })
  .on("error", (err) => {
    console.error(err.message);
    process.exit(1);
  })
  .connect({
    host: VPS_HOST,
    username: VPS_USER,
    password: VPS_PASSWORD,
    readyTimeout: 30000,
  });
