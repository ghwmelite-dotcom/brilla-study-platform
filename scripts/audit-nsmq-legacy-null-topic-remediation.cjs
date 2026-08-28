"use strict";

const { auditArtifacts } = require("./generate-nsmq-legacy-null-topic-remediation.cjs");

function main() {
  const report = auditArtifacts();
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (!report.ok) process.exitCode = 1;
}

if (require.main === module) main();

module.exports = { auditArtifacts };
