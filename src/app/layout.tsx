import "./styles.css";

export const metadata = {
  title: "TrustShield AI Web3 Security Platform",
  description: "Smart contract security scans, Glamsterdam readiness, and persistent Web3 risk intelligence.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
