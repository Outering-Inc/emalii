import { auth } from "@/src/lib/auth";
import { Sheet, SheetContent, SheetTrigger } from "@/src/components/ui/sheet";
import { Button } from "@/src/components/ui/button";
import { Menu } from "lucide-react";
import AdminSidebar from "./adminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session || session.user.role !== "Admin") {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Unauthorized</h1>
        <p className="text-red-500">Admin permission required</p>
      </div>
    );
  }

  return (
    <div className="flex">

      {/* Mobile Sidebar */}
      <div className="md:hidden absolute top-3 left-3 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <AdminSidebar />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <AdminSidebar />
      </div>

      {/* CONTENT */}
      <main className="flex-1 p-6 bg-white min-h-screen">
        {children}
      </main>
    </div>
  );
}
