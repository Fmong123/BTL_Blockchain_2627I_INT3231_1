import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  backHref?: string;
  backLabel?: string;
};

export function PageHeader({ title, description, action, backHref, backLabel = "Quay lại" }: PageHeaderProps) {
  return (
    <header className="bqs-page-header">
      {backHref && (
        <Link href={backHref} className="bqs-back-link">
          <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
          {backLabel}
        </Link>
      )}
      <div className="bqs-intro">
        <div className="min-w-0">
          <h1>{title}</h1>
          {description && <p className="bqs-sub">{description}</p>}
        </div>
        {action && <div className="bqs-page-action">{action}</div>}
      </div>
    </header>
  );
}
