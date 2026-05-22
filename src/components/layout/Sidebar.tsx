"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  role: "USER" | "ADMIN";
}

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/companies", label: "Companies" },
  { href: "/jobs", label: "Jobs" },
  { href: "/profile", label: "Profile" },
];

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  return (
    <nav className="flex h-full w-56 flex-col border-r border-gray-200 bg-white px-3 py-6 gap-1">
      <p className="mb-4 px-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
        Job Tracker
      </p>
      {NAV_LINKS.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-blue-50 text-blue-700"
                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            {label}
          </Link>
        );
      })}
      {role === "ADMIN" && (
        <Link
          href="/admin"
          className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            pathname === "/admin" || pathname.startsWith("/admin/")
              ? "bg-blue-50 text-blue-700"
              : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          }`}
        >
          Admin
        </Link>
      )}
    </nav>
  );
}
