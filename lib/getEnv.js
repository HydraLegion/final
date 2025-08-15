// lib/getEnv.js
export const getEnv = (k) =>
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env[k]) ||
  process.env[k];
