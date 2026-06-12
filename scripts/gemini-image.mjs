#!/usr/bin/env node
// Usage: node scripts/gemini-image.mjs "<prompt>" <output-path> [aspectRatio]
// aspectRatio: "1:1" (default) | "16:9" | "21:9" | "9:16"
// Requires: GEMINI_API_KEY env var
// Output: saves PNG/WebP to output-path, logs result to stdout

import { writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";

const [, , prompt, outputPath, aspectRatio = "1:1"] = process.argv;

if (!prompt || !outputPath) {
  console.error("Usage: node scripts/gemini-image.mjs \"<prompt>\" <output-path> [aspectRatio]");
  process.exit(1);
}

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Error: GEMINI_API_KEY env var is not set");
  process.exit(1);
}

// Supported: 1:1, 9:16, 16:9, 4:3, 3:4
const normalizedAspect = aspectRatio === "21:9" ? "16:9" : aspectRatio;

const body = {
  instances: [{ prompt }],
  parameters: {
    sampleCount: 1,
    aspectRatio: normalizedAspect,
  },
};

// Imagen 4 endpoint via Gemini Developer API
const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${apiKey}`;

try {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`API error ${res.status}: ${err}`);
    process.exit(1);
  }

  const data = await res.json();
  const prediction = data.predictions?.[0];

  if (!prediction?.bytesBase64Encoded) {
    console.error("No image in response:", JSON.stringify(data));
    process.exit(1);
  }

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, Buffer.from(prediction.bytesBase64Encoded, "base64"));
  console.log(`✓ Saved: ${outputPath} (mimeType: ${prediction.mimeType ?? "image/png"})`);

} catch (e) {
  console.error("Fetch error:", e.message);
  process.exit(1);
}
