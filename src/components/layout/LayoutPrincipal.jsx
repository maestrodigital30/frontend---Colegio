import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function LayoutPrincipal() {
  const [sidebarAbierto, setSidebarAbierto] = useState(false);

  return (
    <div className="min-h-screen bg-aurora-deep relative">
      {/* Aurora animated background */}
      <div className="aurora-bg">
        <div className="aurora-orb aurora-orb-1" />
        <div className="aurora-orb aurora-orb-2" />
        <div className="aurora-orb aurora-orb-3" />
      </div>

      {/* Layout */}
      <Sidebar abierto={sidebarAbierto} cerrar={() => setSidebarAbierto(false)} />
      <div className="lg:ml-72 relative z-10">
        <Navbar toggleSidebar={() => setSidebarAbierto(!sidebarAbierto)} />
        <main className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
