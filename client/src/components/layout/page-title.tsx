import { Calendar, Cog, Contact, Home, LayoutDashboard, Package, Receipt, Settings, Truck, Users } from "lucide-react";

type PageTitleProps = {
  title: string;
  subtitle?: string;
  icon?: string;
};

// Icon map based on the icon string passed in
const iconMap: Record<string, React.ReactNode> = {
  dashboard: <LayoutDashboard className="w-6 h-6" />,
  projects: <Home className="w-6 h-6" />,
  tasks: <Calendar className="w-6 h-6" />,
  expenses: <Receipt className="w-6 h-6" />,
  contacts: <Users className="w-6 h-6" />,
  materials: <Package className="w-6 h-6" />,
  labor: <Users className="w-6 h-6" />,
  suppliers: <Truck className="w-6 h-6" />,
  settings: <Settings className="w-6 h-6" />,
  contact: <Contact className="w-6 h-6" />,
  admin: <Cog className="w-6 h-6" />
};

export function PageTitle({ title, subtitle, icon }: PageTitleProps) {
  return (
    <div className="flex items-center gap-4 pb-4">
      {icon && (
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          {iconMap[icon] || <Home className="w-6 h-6" />}
        </div>
      )}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  );
}