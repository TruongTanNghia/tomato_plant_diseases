import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plant Disease AI - Phân Loại Bệnh Cây Trồng",
  description:
    "Hệ thống AI phát hiện và phân loại bệnh cây trồng qua ảnh lá cây. Sử dụng mạng nơ-ron CNN (MobileNetV2) với độ chính xác ~99%.",
  keywords: ["plant disease", "AI", "CNN", "tomato", "leaf disease", "classification"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
