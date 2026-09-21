import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      /*
       * 매물 사진은 Supabase Storage 의 공개 경로에서 온다.
       * 호스트를 환경변수로 계산하면 변수가 없는 환경(예: 배포 서버 첫 빌드)에서
       * 설정 파일 자체가 터지므로, 프로젝트 주소를 와일드카드로 받는다.
       */
      {
        protocol: "https",
        hostname: "*.supabase.co",
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
