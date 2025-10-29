import React from 'react';

interface PageTitleProps {
  title: string;
  subtitle?: string;
  icon?: string;
  actions?: React.ReactNode;
}

export default function PageTitle({ title, subtitle, icon, actions }: PageTitleProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-2">
      <div className="flex items-center gap-3">
        {icon && <i className={`ri-${icon} text-2xl opacity-80`}></i>}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex gap-2 w-full md:w-auto justify-end">{actions}</div>}
    </div>
  );
}