module.exports = {
  apps: [
    {
      name: "mision-manizales",
      script: ".next/standalone/server.js",
      cwd: "/home/mision_mzl/mision-manizales-src",
      env: { NODE_ENV: "production", PORT: "8010" },
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "400M",
    },
  ],
};
