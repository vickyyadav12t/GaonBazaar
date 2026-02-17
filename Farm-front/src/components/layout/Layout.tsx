import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import MobileNav from './MobileNav';
import ChatBot from '@/components/chat/ChatBot';
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
      <Header />
      <main className={`flex-1 ${showMobileNav && isAuthenticated ? 'pb-20 md:pb-0' : ''}`}>
        {children}
      </main>
      {showFooter && <Footer />}
      {showMobileNav && <MobileNav />}
      <ChatBot />
    </div>
  );
};

export default Layout;
