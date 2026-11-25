import type { ReactNode } from "react";

export function InfoSection({
  title,
  description,
  icon,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`card border border-base-300 bg-base-100 bqs-info-section ${className}`}>
      <div className="bqs-section-heading">
        {icon && (
          <span className="bqs-section-icon" aria-hidden="true">
            {icon}
          </span>
        )}
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
      </div>
      <div className="bqs-section-content">{children}</div>
    </section>
  );
}
