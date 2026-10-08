import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Deprecated: this app was consolidated into the Neobank Solution demo.
  async redirects() {
    return [
      {
        source: "/:path*",
        destination: "https://neobank-solution.demos-crossmint.com/",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
