import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pwaMod = require("next-pwa");
const pwaFactory = typeof pwaMod === "function" ? pwaMod : pwaMod?.default;
const withPWA = pwaFactory({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default withPWA(nextConfig);
