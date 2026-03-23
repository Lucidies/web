'use client';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <main className="min-h-screen">
      <div className="flex items-start justify-center min-h-[calc(100vh-86px)] p-5 pt-3 max-md:p-3 max-md:pt-2 max-md:min-h-[calc(100vh-68px)]">
        {children}
      </div>
    </main>
  );
}
