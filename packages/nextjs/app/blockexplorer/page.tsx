"use client";

import { PaginationButton, SearchBar, TransactionsTable } from "./_components";
import { hardhat } from "viem/chains";
import { PageHeader } from "~~/components/PageHeader";
import { copyrightChain } from "~~/copyright.config";
import { useFetchBlocks, useTargetNetwork } from "~~/hooks/scaffold-eth";

export default function BlockExplorer() {
  if (copyrightChain.id !== hardhat.id)
    return (
      <div className="bqs-page">
        <PageHeader title="Tra cứu giao dịch" description="Xem giao dịch và contract trên Sepolia Etherscan." />
        <a
          className="btn btn-primary"
          href={copyrightChain.blockExplorers.default.url}
          target="_blank"
          rel="noreferrer"
        >
          Mở Sepolia Etherscan ↗
        </a>
      </div>
    );
  return <LocalBlockExplorer />;
}

function LocalBlockExplorer() {
  const { blocks, transactionReceipts, currentPage, hasNextPage, setCurrentPage, error } = useFetchBlocks();
  const { targetNetwork } = useTargetNetwork();
  return (
    <div className="bqs-page">
      <PageHeader
        title="Tra cứu giao dịch"
        description="Tìm giao dịch, địa chỉ ví và hoạt động của contract trên mạng local."
      />
      {targetNetwork.id !== hardhat.id ? (
        <div role="alert" className="alert alert-warning">
          Trang này dùng cho blockchain local. Hãy chuyển về mạng Hardhat.
        </div>
      ) : (
        <>
          <SearchBar />
          {error ? (
            <div role="alert" className="alert alert-error">
              Không đọc được giao dịch. Kiểm tra blockchain local và tải lại trang.
            </div>
          ) : (
            <TransactionsTable blocks={blocks} transactionReceipts={transactionReceipts} />
          )}
          <PaginationButton currentPage={currentPage} hasNextPage={hasNextPage} setCurrentPage={setCurrentPage} />
        </>
      )}
    </div>
  );
}
