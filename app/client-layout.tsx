import { ThemeProvider } from "@/components/theme/theme-provider";

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider>
      <main className="min-h-screen w-full">{children}</main>
    </ThemeProvider>
  );
}
