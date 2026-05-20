import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import { LayoutDashboard, Flame, Zap, Droplets, Trash2, Wind, LogOut, Sparkles, Users } from "lucide-react";

const nav = [
  { href: "/overview",  label: "Overview",       icon: LayoutDashboard },
  { href: "/emissions", label: "GHG Emissions",  icon: Flame },
  { href: "/energy",    label: "Energy",         icon: Zap },
  { href: "/water",     label: "Water",          icon: Droplets },
  { href: "/waste",     label: "Waste",          icon: Trash2 },
  { href: "/air",       label: "Air pollutants", icon: Wind },
  { href: "/ask",       label: "Ask AI",         icon: Sparkles }
];

export default async function DashLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: me } = user?.email
    ? await supabase.from("allowed_users").select("role").eq("email", user.email.toLowerCase()).maybeSingle()
    : { data: null };

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-5 border-b border-gray-200">
          <div className="font-semibold text-base">IRC ESG</div>
          <div className="text-xs text-gray-500">2021-2025 Reporting</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-gray-100 text-gray-700">
              <Icon size={16} />{label}
            </Link>
          ))}
          {me?.role === "admin" && (
            <Link href="/admin" className="flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-gray-100 text-gray-700 border-t border-gray-100 mt-3 pt-3">
              <Users size={16}/> Access
            </Link>
          )}
        </nav>
        <div className="p-3 border-t border-gray-200 text-xs">
          <div className="text-gray-500 mb-2 truncate">{user?.email}</div>
          <form action="/api/signout" method="post">
            <button className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900">
              <LogOut size={13}/> Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
