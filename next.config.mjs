/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
      },
      {
        protocol: "https",
        hostname: "rwkeaywvokhguvftrzse.supabase.co",
        port: "",
      },
    ],
  },
};

export default nextConfig;
