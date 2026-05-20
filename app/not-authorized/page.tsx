import Link from "next/link";

export default function NotAuthorized() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md bg-white border border-gray-200 rounded-lg p-8 text-center">
        <h1 className="text-xl font-semibold mb-2">Access not authorised</h1>
        <p className="text-sm text-gray-600 mb-6">
          Your email isn&apos;t on the access list for this dashboard. Contact your administrator to request access.
        </p>
        <Link href="/login" className="text-sm text-brand hover:text-brand-dark underline">Try a different email</Link>
      </div>
    </main>
  );
}
