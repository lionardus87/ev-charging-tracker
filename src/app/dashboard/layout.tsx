import Sidebar from "@/src/client/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      {/* offset for sidebar on desktop, top bar + bottom tab on mobile */}
      <div className="md:pl-56 pt-14 pb-20 md:pt-0 md:pb-0">
        {children}
      </div>
    </div>
  );
}
