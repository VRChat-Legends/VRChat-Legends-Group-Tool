import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TitleBar from './TitleBar';

export default function Layout() {
  return (
    <div
      className="vrcl-app-bg bg-beams flex flex-col"
      style={{ height: '100vh', overflow: 'hidden', contain: 'strict' }}
    >
      {/* Custom title bar – only rendered inside Electron */}
      <TitleBar />

      {/* Sidebar + content */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar />

        {/* Scrollable content pane */}
        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden relative z-[1]">
          <div className="px-6 py-5 mx-auto" style={{ maxWidth: '1200px', minHeight: '100%' }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
