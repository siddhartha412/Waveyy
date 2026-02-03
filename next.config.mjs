import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pwaMod = require("next-pwa");
const withPWA = typeof pwaMod === "function" ? pwaMod : pwaMod?.default;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pwa: {
    dest: "public",
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === "development",
  },
};

export default withPWA(nextConfig);
