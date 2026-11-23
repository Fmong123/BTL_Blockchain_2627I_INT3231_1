import Link from "next/link";
import { CheckCircleIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";
import { useCopyToClipboard } from "~~/hooks/scaffold-eth";

export const TransactionHash = ({ hash }: { hash: string }) => {
  const { copyToClipboard, isCopiedToClipboard } = useCopyToClipboard();
  return (
    <div className="flex items-center gap-2">
      <Link href={`/blockexplorer/transaction/${hash}`} className="link link-hover font-mono" title={hash}>
        {hash.slice(0, 6)}…{hash.slice(-4)}
      </Link>
      <button
        type="button"
        className="btn btn-ghost btn-xs !p-1"
        aria-label="Sao chép hash giao dịch"
        onClick={() => void copyToClipboard(hash)}
      >
        {isCopiedToClipboard ? (
          <CheckCircleIcon className="h-4 w-4" aria-hidden="true" />
        ) : (
          <DocumentDuplicateIcon className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
      <span role="status" className="sr-only">
        {isCopiedToClipboard ? "Đã sao chép hash" : ""}
      </span>
    </div>
  );
};
