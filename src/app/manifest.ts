import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rahul & Somya — Wedding Planner",
    short_name: "R & S Wedding",
    description: "Plan every celebration — Myrah to Phera — in one elegant place.",
    start_url: "/",
    display: "standalone",
    background_color: "#3a0f1f",
    theme_color: "#7b1e3b",
    orientation: "portrait",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
