import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // El optimizador de imágenes falla en standalone sin sharp; servimos /public directo.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
