import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // node_modules lives at Desktop level (parent of this project dir),
    // so root must include that parent for Turbopack to resolve Next.js itself
    root: path.join(__dirname, ".."),
  },
};

export default nextConfig;
