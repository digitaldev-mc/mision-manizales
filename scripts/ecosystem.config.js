const fs = require("fs");
const path = require("path");

function loadEnv(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;

  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;

    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }

  return env;
}

const projectRoot = path.join(__dirname, "..");
const envFromFile = loadEnv(path.join(projectRoot, ".env"));

module.exports = {
  apps: [
    {
      name: "mision-manizales",
      script: ".next/standalone/server.js",
      cwd: projectRoot,
      env: {
        NODE_ENV: "production",
        PORT: "8010",
        ...envFromFile,
      },
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "400M",
    },
  ],
};
