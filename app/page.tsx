import Link from "next/link";
import { ItemsIcon, PlaceholderIcon } from "@/components/icons";
import Breadcrumb from "@/components/ui/breadcrumb";

export default function HomePage() {
  const cards: {
    href: string;
    label: string;
    description: string;
    icon: React.ReactNode;
  }[] = [
    {
      href: "/items",
      label: "Items",
      description: "CRUD for your inventory items.",
      icon: <ItemsIcon className="w-6 h-6" />,
    },
    {
      href: "#",
      label: "(Future)",
      description: "Placeholder for upcoming module.",
      icon: <PlaceholderIcon className="w-6 h-6" />,
    },
  ];
  return (
    <div className="space-y-8">
      <Breadcrumb items={[{ label: "Home" }]} />
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Choose a section to manage data.
        </p>
      </header>
      <section className="grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <Link
            key={c.href + c.label}
            href={c.href}
            className="group rounded-lg border p-4 flex items-start gap-4 hover:shadow-sm hover:border-blue-400 transition-colors"
          >
            <div className="text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
              {c.icon}
            </div>
            <div className="flex flex-col">
              <span className="font-medium flex items-center gap-2">
                {c.label}
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                {c.description}
              </span>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
