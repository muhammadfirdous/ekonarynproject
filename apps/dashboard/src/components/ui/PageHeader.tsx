import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-eco-text">{title}</h1>
        {description && <p className="text-eco-gray mt-1">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
