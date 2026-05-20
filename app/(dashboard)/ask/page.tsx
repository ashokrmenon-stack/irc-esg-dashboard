import { AskClient } from "./AskClient";

export default function AskPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <header>
        <h1 className="text-2xl font-semibold">Ask IRC ESG</h1>
        <p className="text-sm text-gray-500">
          Natural-language answers grounded in your uploaded ESG documents.
        </p>
      </header>
      <AskClient />
    </div>
  );
}
