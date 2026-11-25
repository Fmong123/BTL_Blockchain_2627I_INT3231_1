import type { ReactNode } from "react";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

const noticeStyles = {
  info: { className: "alert-info", Icon: InformationCircleIcon },
  success: { className: "alert-success", Icon: CheckCircleIcon },
  warning: { className: "alert-warning", Icon: ExclamationTriangleIcon },
  error: { className: "alert-error", Icon: XCircleIcon },
};

export function Notice({
  tone = "info",
  title,
  children,
  role,
  className = "",
}: {
  tone?: keyof typeof noticeStyles;
  title?: string;
  children: ReactNode;
  role?: "alert" | "status";
  className?: string;
}) {
  const { className: toneClass, Icon } = noticeStyles[tone];
  return (
    <div role={role} className={`alert ${toneClass} bqs-notice ${className}`}>
      <Icon className="bqs-notice-icon" aria-hidden="true" />
      <div className="bqs-notice-content">
        {title && <strong className="bqs-notice-title">{title}</strong>}
        {children}
      </div>
    </div>
  );
}
