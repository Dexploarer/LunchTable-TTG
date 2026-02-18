import { Link } from "react-router";

const LINKS = [
  { label: "Home", to: "/" },
  { label: "Studio", to: "/studio" },
  { label: "Worlds", to: "/worlds" },
  { label: "Table", to: "/table/new" },
  { label: "LFG", to: "/lfg" },
  { label: "Publish", to: "/publish" },
  { label: "Agents", to: "/agent-ops" },
  { label: "Providers", to: "/settings/providers" },
];

export function TrayNav({ invert = false }: { invert?: boolean }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t-2 border-[#121212] bg-[#fdfdfb]">
      <div className="max-w-6xl mx-auto px-2 py-2 overflow-x-auto hide-scrollbar">
        <div className="flex gap-2 min-w-max">
          {LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="px-3 py-1 border-2 border-[#121212] bg-white text-xs uppercase font-black"
              style={{
                filter: invert ? "invert(1)" : "none",
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
