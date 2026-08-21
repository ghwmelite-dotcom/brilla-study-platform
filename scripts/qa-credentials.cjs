'use strict';

const QA_ROLES = new Set(['student', 'teacher', 'parent', 'admin']);

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getQaCredentials(role) {
  if (!QA_ROLES.has(role)) {
    throw new Error(`Unsupported QA role: ${role}`);
  }

  const prefix = `BRILLA_E2E_${role.toUpperCase()}`;
  return [requiredEnv(`${prefix}_EMAIL`), requiredEnv(`${prefix}_PASSWORD`)];
}

module.exports = { getQaCredentials };
