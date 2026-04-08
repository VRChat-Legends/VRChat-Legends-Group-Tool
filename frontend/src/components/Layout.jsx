import { Outlet } from 'react-router-dom';
import NavBar from './NavBar';
import Footer from './Footer';

export default function Layout() {
  return (
    <div className="relative z-0 flex min-h-screen flex-col vrcl-app-bg bg-beams">
      <NavBar />
      <main className="relative z-[1] mx-auto min-h-0 w-full max-w-none flex-1 overflow-x-hidden overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
