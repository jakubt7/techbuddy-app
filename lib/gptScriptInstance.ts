import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GPTScript } from "@gptscript-ai/gptscript";

// Increase readiness wait time for the embedded GPTScript server in serverless.
// The default is 20 attempts (10s); server cold starts on Vercel can take longer.
if (typeof (GPTScript.prototype as any).testGPTScriptURL === "function") {
  (GPTScript.prototype as any).testGPTScriptURL = async function testGPTScriptURL(
    count = 60 // 30s total (60 * 500ms)
  ) {
    try {
      await fetch(`${(GPTScript as any).serverURL}/healthz`);
      console.log("[gptScriptInstance] GPTScript healthz ok at", (GPTScript as any).serverURL);
      return true;
    } catch {
      if (count % 10 === 0) {
        console.log(
          "[gptScriptInstance] Waiting for GPTScript server",
          (GPTScript as any).serverURL,
          "remaining attempts:",
          count
        );
      }
      if (count === 0) {
        throw new Error("Failed to wait for gptscript to be ready");
      }
      await new Promise((r) => setTimeout(r, 500));
      return (GPTScript.prototype as any).testGPTScriptURL.call(this, count - 1);
    }
  };
}

const gptscriptCandidates = [
  process.env.GPTSCRIPT_BIN,
  path.join(
    process.cwd(),
    "node_modules",
    "@gptscript-ai",
    "gptscript",
    "bin",
    "gptscript"
  ),
  path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "node_modules",
    "@gptscript-ai",
    "gptscript",
    "bin",
    "gptscript"
  ),
  path.join(
    process.cwd(),
    ".next",
    "server",
    "chunks",
    "node_modules",
    "@gptscript-ai",
    "gptscript",
    "bin",
    "gptscript"
  ),
  "/var/task/node_modules/@gptscript-ai/gptscript/bin/gptscript",
];

// Ensure GPTScript has a writable workspace (Vercel FS is read-only except /tmp).
const workspaceDir = path.join("/tmp", "gptscript-workspace");
try {
  fs.mkdirSync(workspaceDir, { recursive: true });
  process.env.GPTSCRIPT_WORKSPACE = workspaceDir;
  process.env.HOME = process.env.HOME || workspaceDir;
  console.log("[gptScriptInstance] Using GPTScript workspace", workspaceDir);
} catch (error) {
  console.warn("[gptScriptInstance] Failed to create workspace", {
    workspaceDir,
    error,
  });
}

const resolvedGptscriptBin =
  gptscriptCandidates.find((p) => p && fs.existsSync(p)) ??
  gptscriptCandidates[1];

if (resolvedGptscriptBin) {
  const tmpPath = path.join("/tmp", "gptscript");
  try {
    fs.copyFileSync(resolvedGptscriptBin, tmpPath);
    fs.chmodSync(tmpPath, 0o755);
    process.env.GPTSCRIPT_BIN = tmpPath;
    console.log(
      "[gptScriptInstance] Using GPTScript binary at",
      tmpPath,
      "(copied from",
      resolvedGptscriptBin,
      ")"
    );
  } catch (error) {
    console.warn(
      "[gptScriptInstance] Failed to prepare GPTScript binary, falling back to traced path",
      { resolvedGptscriptBin, tmpPath, error }
    );
    process.env.GPTSCRIPT_BIN = resolvedGptscriptBin;
  }
} else {
  console.warn("[gptScriptInstance] GPTScript binary not found in traced paths", {
    candidates: gptscriptCandidates,
    cwd: process.cwd(),
    dirname: path.dirname(fileURLToPath(import.meta.url)),
  });
}

const gpt = new GPTScript({
  APIKey: process.env.OPENAI_API_KEY,
  DefaultModel: "gpt-3.5-turbo"
});

export default gpt
