import AppSidebar from './AppSidebar';
export default function DashboardLayout({ children }) {
    return (<div className="min-h-screen bg-background lg:flex lg:h-screen lg:overflow-hidden">
      <AppSidebar />
      <main className="min-w-0 flex-1 lg:h-screen lg:overflow-y-auto">
        {children}
      </main>
    </div>);
}
