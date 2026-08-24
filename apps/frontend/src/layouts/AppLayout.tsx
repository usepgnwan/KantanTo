import React from 'react';
import Navbar from '../components/organisms/Navbar';
import BottomNav from '../components/organisms/BottomNav';
import { Link } from 'react-router-dom';

interface AppLayoutProps {
  children: React.ReactNode;
  hideBottomNav?: boolean;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, hideBottomNav }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pb-20 md:pb-0">
        {children}
      </main>
      {!hideBottomNav && <BottomNav />}
      <footer className="bg-surface-low dark:bg-zinc-900/80 pt-20 pb-10 mt-auto transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-xl font-bold font-manrope mb-6 text-surface-on">Rifaya Tryout</h3>
              <p className="text-surface-on/60 max-w-sm leading-relaxed">
                Menyediakan platform belajar dan tryout berkualitas tinggi untuk membantu generasi muda Indonesia mencapai pendidikan impian mereka.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-bold uppercase tracking-[0.1em] mb-6 text-surface-on/80 italic">MENU UTAMA</h4>
              <ul className="space-y-4 text-sm text-surface-on/40">
                <li className="hover:text-primary transition-colors cursor-pointer"><Link to="/">Beranda</Link></li>
                <li className="hover:text-primary transition-colors cursor-pointer"><Link to="/paket">Katalog Paket</Link></li>
                <li className="hover:text-primary transition-colors cursor-pointer"><Link to="/blog">Blog</Link></li>
                <li className="hover:text-primary transition-colors cursor-pointer"><Link to="/kontak">Kontak</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold uppercase tracking-[0.1em] mb-6 text-surface-on/80 italic">BANTUAN & LEGAL</h4>
              <ul className="space-y-4 text-sm text-surface-on/40">
                <li className="hover:text-primary transition-colors cursor-pointer">Help Center</li>
                <li className="hover:text-primary transition-colors cursor-pointer">Privacy Policy</li>
                <li className="hover:text-primary transition-colors cursor-pointer">Terms of Service</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-surface-on/5 text-sm text-surface-on/40">
            © {new Date().getFullYear()} Rifaya Tryout. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;
