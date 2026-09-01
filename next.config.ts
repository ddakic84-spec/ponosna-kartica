import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Excel фајлови које админ учитава (највећи ~110 KB). 4 MB је са резервом.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
