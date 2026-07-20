export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <main className="min-h-screen w-full">{children}</main>;
}
