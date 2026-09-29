import { spawn } from "node:child_process";
import { connect } from "node:net";
import { fileURLToPath } from "node:url";

const children = [];
let stopping = false;

function stop(signal = "SIGTERM") {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill(signal);
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => stop(signal));
}

function start(command, args, options = {}) {
  const child = spawn(command, args, { stdio: "inherit", ...options });
  children.push(child);
  child.on("error", (error) => {
    console.error(error);
    process.exitCode = 1;
    stop();
  });
  child.on("exit", (code) => {
    if (stopping) return;
    process.exitCode = code || 1;
    stop();
  });
  return child;
}

function waitForLogos(child) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + 15_000;
    const probe = () => {
      if (child.exitCode !== null) return reject(new Error("Logos Worker を起動できません"));
      const socket = connect(8787, "127.0.0.1");
      socket.once("connect", () => {
        socket.destroy();
        resolve();
      });
      socket.once("error", () => {
        socket.destroy();
        if (Date.now() >= deadline) reject(new Error("Logos Worker の起動が時間切れです"));
        else setTimeout(probe, 100);
      });
    };
    probe();
  });
}

try {
  const logos = start(
    process.execPath,
    [
      fileURLToPath(
        new URL("../apps/logos/node_modules/wrangler/bin/wrangler.js", import.meta.url),
      ),
      "dev",
      "--config",
      "wrangler.jsonc",
      "--port",
      "8787",
    ],
    { cwd: fileURLToPath(new URL("../apps/logos/", import.meta.url)) },
  );
  await waitForLogos(logos);
  if (!stopping) start("vp", ["dev", ...process.argv.slice(2)]);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
  stop();
}
