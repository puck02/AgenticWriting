import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("production systemd service", () => {
  it("starts Next with Node env proxy support", () => {
    const service = readFileSync(
      join(process.cwd(), "deploy/systemd/agentic-writing-8889.service"),
      "utf8"
    );

    expect(service).toContain('Environment="NODE_OPTIONS=--max-old-space-size=512 --use-env-proxy"');
    expect(service).toContain("ExecStart=/usr/bin/npm run start -- -H 0.0.0.0 -p 8889");
  });
});
