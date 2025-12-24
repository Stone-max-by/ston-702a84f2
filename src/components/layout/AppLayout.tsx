import { ReactNode } from "react";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";

interface AppLayoutProps {
  children: ReactNode;
  title: string;
  showBack?: boolean;
  onBack?: () => void;
}

export function AppLayout({ children, title, showBack, onBack }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header title={title} showBack={showBack} onBack={onBack} />
      <main
        style={{ paddingTop: "calc(var(--header-height) + var(--safe-area-top))" }}
        className="pb-bottom-nav"
      >
        <div className="p-3">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}
