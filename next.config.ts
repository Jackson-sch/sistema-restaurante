import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      allowedOrigins: [
        // El origen local, si lo necesitas
        "localhost:3000", 
        // **AÑADE AQUÍ EL DOMINIO DEL TÚNEL**
        "*.devtunnels.ms", // Permite todos los subdominios de devtunnels.ms (RECOMENDADO)
        // O la URL específica de tu túnel si el comodín no funciona
        // "ckx0c2lj-3000.brs.devtunnels.ms", 
      ],
    },
  },
};

export default nextConfig;
