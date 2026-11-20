import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export const BackButton = () => (
  <Link href="/blockexplorer" className="btn btn-outline btn-sm">
    <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" /> Tra cứu giao dịch
  </Link>
);
