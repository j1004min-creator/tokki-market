import type { NextConfig } from "next";

const supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHost,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  experimental: {
    serverActions: {
      // 매물 사진(최대 5MB)이 서버 액션으로 올라온다
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
