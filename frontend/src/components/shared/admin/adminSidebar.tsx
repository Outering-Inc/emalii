"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingBag, Users, Package, } from "lucide-react";


export default function AdminSidebar() {
  const pathname = usePathname();

  const menu = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
    { label: "Orders", icon: ShoppingBag, href: "/admin/orders" },
    { label: "Products", icon: Package, href: "/admin/products" },
    { label: "Users", icon: Users, href: "/admin/users" },
  ];

  return (
    <div className="w-[230px] bg-base-200 border-r min-h-screen p-4 flex flex-col">

      {/* Heading only */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-bold text-lg">Admin Panel</h1>
      </div>

      {/* MENU */}
      <ul className="space-y-2">
        {menu.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 p-2 rounded-lg transition 
                ${isActive ? "bg-primary text-white" : "hover:bg-base-300"}`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
