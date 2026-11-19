"use client";

import { useCopyToClipboard } from "~~/hooks/scaffold-eth";

export function WorkHash({ fileHash }: { fileHash: `0x${string}` }) {
  const { copyToClipboard, isCopiedToClipboard } = useCopyToClipboard();

  return (
    <div className="space-y-2">
      <code className="block break-all font-mono text-xs leading-relaxed">{fileHash}</code>
      <button type="button" className="btn btn-outline btn-xs" onClick={() => void copyToClipboard(fileHash)}>
        Sao chép hash
      </button>
      <span role="status" className="ml-2 text-xs">
        {isCopiedToClipboard && "Đã sao chép"}
      </span>
    </div>
  );
}
