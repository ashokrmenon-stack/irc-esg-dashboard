"use client";
import { useState, useTransition } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type User = { email: string; added_at: string; added_by: string | null; role: string; notes: string | null };

export function AdminClient({ users: initial, myEmail }: { users: User[]; myEmail: string }) {
  const [users, setUsers] = useState<User[]>(initial);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"viewer" | "admin">("viewer");
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const sb = supabaseBrowser();
    const clean = email.toLowerCase().trim();
    const { error } = await sb.from("allowed_users")
      .insert({ email: clean, role, notes: notes || null, added_by: myEmail });
    if (error) { setErr(error.message); return; }
    start(async () => {
      const { data } = await sb.from("allowed_users").select("*").order("added_at", { ascending: false });
      setUsers(data ?? []);
      setEmail(""); setNotes(""); setRole("viewer");
    });
  }

  async function remove(target: string) {
    if (target === myEmail) { setErr("You can't remove yourself."); return; }
    if (!confirm(`Remove access for ${target}?`)) return;
    const sb = supabaseBrowser();
    const { error } = await sb.from("allowed_users").delete().eq("email", target);
    if (error) { setErr(error.message); return; }
    setUsers(users.filter(u => u.email !== target));
  }

  return (
    <div className="space-y-6">
      <form onSubmit={add} className="bg-white border border-gray-200 rounded-lg p-5 space-y-3">
        <h2 className="font-medium">Add user</h2>
        <div className="grid grid-cols-3 gap-3">
          <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="email@example.com" className="border border-gray-300 rounded px-3 py-2 text-sm" />
          <select value={role} onChange={e => setRole(e.target.value as "viewer" | "admin")}
            className="border border-gray-300 rounded px-3 py-2 text-sm">
            <option value="viewer">Viewer</option>
            <option value="admin">Admin</option>
          </select>
          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)"
            className="border border-gray-300 rounded px-3 py-2 text-sm" />
        </div>
        {err && <div className="text-sm text-red-600">{err}</div>}
        <button disabled={pending} type="submit" className="bg-brand hover:bg-brand-dark text-white text-sm px-4 py-2 rounded">
          {pending ? "Saving..." : "Add"}
        </button>
      </form>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Added</th>
              <th className="px-4 py-3">Notes</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.email} className="border-b border-gray-100">
                <td className="px-4 py-3 font-mono text-xs">{u.email}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded ${u.role==='admin'?'bg-brand-bg text-brand-dark':'bg-gray-100 text-gray-700'}`}>{u.role}</span></td>
                <td className="px-4 py-3 text-xs text-gray-500">{new Date(u.added_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{u.notes ?? ""}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => remove(u.email)} className="text-xs text-red-600 hover:text-red-800">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
