import path from "path";

/** @type {import("next").NextConfig} */
const nextConfig = {
  distDir: ".next",
  turbopack: {
    root: path.resolve(process.cwd()),
  },
};

export default nextConfig;