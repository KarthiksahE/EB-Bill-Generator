import Sidebar from "./Sidebar";

export default function Layout({ children }) {
  return (
    <div className="mx-auto min-h-screen max-w-7xl p-4 md:p-6">
      <div className="grid gap-4 md:grid-cols-[260px_1fr]">
        <Sidebar />
        <main className="space-y-4">{children}</main>
      </div>
    </div>
  );
}
