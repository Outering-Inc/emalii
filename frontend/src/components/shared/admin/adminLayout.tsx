import { auth } from "@/src/lib/auth";
import Link from "next/link";

const AdminLayout = async ({
  activeItem = "dashboard",
  children,
}: {
  activeItem: string;
  children: React.ReactNode;
}) => {
  const session = await auth();

  console.log("SESSION IN LAYOUT:", session);  // <-- DEBUG LOG

  // ROLE MUST MATCH EXACTLY WHAT YOU STORE
  if (!session || session.user.role !== "Admin") {
    return (
      <div className="relative flex flex-grow p-6">
        <div>
          <h1 className="text-2xl font-bold">Unauthorized</h1>
          <p className="text-red-500">Admin permission required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-grow">
      <div className="w-full grid md:grid-cols-5">

        {/* LEFT SIDEBAR */}
        <div className="bg-base-200 min-h-screen p-4">
          <ul className="menu">

            <li>
              <Link
                href="/admin/dashboard"
                className={activeItem === "dashboard" ? "active" : ""}
              >
                Dashboard
              </Link>
            </li>

            <li>
              <Link
                href="/admin/orders"
                className={activeItem === "orders" ? "active" : ""}
              >
                Orders
              </Link>
            </li>

            <li>
              <Link
                href="/admin/products"
                className={activeItem === "products" ? "active" : ""}
              >
                Products
              </Link>
            </li>

            <li>
              <Link
                href="/admin/users"
                className={activeItem === "users" ? "active" : ""}
              >
                Users
              </Link>
            </li>

          </ul>
        </div>

        {/* PAGE CONTENT */}
        <div className="md:col-span-4 p-6 bg-white min-h-screen">
          {children}
        </div>

      </div>
    </div>
  );
};

export default AdminLayout;
