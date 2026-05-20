import { createServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { AdminClient } from "./AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const sb = createServerClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user?.email) redirect("/login");

  const { data: me } = await sb.from("allowed_users")
    .select("email, role").eq("email", user.email.toLowerCase()).maybeSingle();

  if (!me || me.role !== "admin") {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold mb-2">Admin</h1>
        <p className="text-sm text-gray-600">You need an <span className="font-medium">admin</span> role to manage user access.</p>
      </div>
    );
  }

  const { data: users } = await sb.from("allowed_users")
    .select("email, added_at, added_by, role, notes").order("added_at", { ascending: false });

  return (
    <div className="max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Access Management</h1>
        <p className="text-sm text-gray-500">Add or remove emails authorised to view this dashboard.</p>
      </header>
      <AdminClient users={users ?? []} myEmail={user.email.toLowerCase()} />
    </div>
  );
}
