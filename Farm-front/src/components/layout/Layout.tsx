import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import MobileNav from './MobileNav';
import ChatBot from '@/components/chat/ChatBot';
import CopilotPanel from '@/components/copilot/CopilotPanel';
import { useAppSelector } from '@/hooks/useRedux';

interface LayoutProps {
  children: ReactNode;
  showFooter?: boolean;
  showMobileNav?: boolean;
}

const Layout = ({ children, showFooter = true, showMobileNav = true }: LayoutProps) => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="print:hidden">
        <Header />
      </div>
      <main
        className={`flex-1 min-w-0 ${showMobileNav && isAuthenticated ? 'pb-20 md:pb-0' : ''}`}
      >
        {children}
      </main>
      {showFooter && (
        <div className="print:hidden">
          <Footer />
        </div>
      )}
      {showMobileNav && (
        <div className="print:hidden">
          <MobileNav />
        </div>
      )}
      <div className="print:hidden">
        <CopilotPanel />
        <ChatBot />
      </div>
    </div>
  );
};

export default Layout;
