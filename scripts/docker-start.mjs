import { spawn } from "node:child_process";
import "./sites-env.mjs";

const host = process.env.HOST || "0.0.0.0";
const port = process.env.PORT || "8787";

const child = spawn(
  process.execPath,
  [
    "./node_modules/wrangler/bin/wrangler.js",
    "dev",
    "--config",
    "dist/server/wrangler.json",
    "--local",
    "--persist-to",
    ".wrangler/state",
    "--ip",
    host,
    "--port",
    port,
    "--inspector-port",
    "0",
  ],
  { stdio: "inherit" },
);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
