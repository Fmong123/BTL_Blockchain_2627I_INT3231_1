"use client";

import { Address } from "@scaffold-ui/components";
import { useQuery } from "@tanstack/react-query";
import { Hash, formatEther, formatUnits } from "viem";
import { hardhat } from "viem/chains";
import { usePublicClient } from "wagmi";
import { PageHeader } from "~~/components/PageHeader";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";
import { decodeTransactionData, getFunctionDetails } from "~~/utils/scaffold-eth";
import { replacer } from "~~/utils/scaffold-eth/common";

const TransactionComp = ({ txHash }: { txHash: Hash }) => {
  const client = usePublicClient({ chainId: hardhat.id });
  const { targetNetwork } = useTargetNetwork();
  const query = useQuery({
    queryKey: ["explorerTransaction", hardhat.id, txHash],
    enabled: Boolean(client),
    retry: false,
    queryFn: async () => {
      if (!client) throw new Error("Chưa kết nối được blockchain.");
      const [tx, receipt] = await Promise.all([
        client.getTransaction({ hash: txHash }),
        client.getTransactionReceipt({ hash: txHash }),
      ]);
      return { transaction: decodeTransactionData(tx), receipt };
    },
  });
  const { transaction, receipt } = query.data ?? {};
  return (
    <div className="bqs-page">
      <PageHeader
        title="Chi tiết giao dịch"
        description="Thông tin giao dịch đã ghi nhận trên blockchain local."
        backHref="/blockexplorer"
        backLabel="Tra cứu giao dịch"
      />
      {query.isError ? (
        <div role="alert" className="alert alert-error flex flex-wrap">
          <span>Không tìm thấy hoặc không đọc được giao dịch. Kiểm tra hash và kết nối blockchain local.</span>
          <button className="btn btn-sm" onClick={() => void query.refetch()}>
            Thử lại
          </button>
        </div>
      ) : !transaction ? (
        <p role="status">Đang đọc giao dịch…</p>
      ) : (
        <section className="bqs-explorer-panel" aria-label="Thông tin giao dịch">
          <dl className="bqs-data-list">
            <div className="bqs-data-row">
              <dt>Hash giao dịch</dt>
              <dd>
                <code className="bqs-code">{transaction.hash}</code>
              </dd>
            </div>
            <div className="bqs-data-row">
              <dt>Trạng thái</dt>
              <dd>
                <span className={`badge ${receipt?.status === "success" ? "badge-success" : "badge-error"}`}>
                  {receipt?.status === "success" ? "Thành công" : "Thất bại"}
                </span>
              </dd>
            </div>
            <div className="bqs-data-row">
              <dt>Số khối</dt>
              <dd>{transaction.blockNumber?.toString() ?? "Đang chờ"}</dd>
            </div>
            <div className="bqs-data-row">
              <dt>Ví gửi</dt>
              <dd className="bqs-address-value">
                <Address address={transaction.from} format="long" size="base" onlyEnsOrAddress chain={targetNetwork} />
              </dd>
            </div>
            <div className="bqs-data-row">
              <dt>{receipt?.contractAddress ? "Contract được tạo" : "Địa chỉ nhận"}</dt>
              <dd className="bqs-address-value">
                {receipt?.contractAddress || transaction.to ? (
                  <Address
                    address={receipt?.contractAddress ?? transaction.to ?? undefined}
                    format="long"
                    size="base"
                    onlyEnsOrAddress
                    chain={targetNetwork}
                  />
                ) : (
                  "Tạo contract"
                )}
              </dd>
            </div>
            <div className="bqs-data-row">
              <dt>Giá trị</dt>
              <dd>
                {formatEther(transaction.value)} {targetNetwork.nativeCurrency.symbol}
              </dd>
            </div>
            <div className="bqs-data-row">
              <dt>Hàm được gọi</dt>
              <dd>
                {transaction.input === "0x" ? (
                  "Chuyển ETH"
                ) : (
                  <code className="bqs-code block">
                    {receipt?.contractAddress
                      ? "Triển khai contract"
                      : getFunctionDetails(transaction) || transaction.functionName || transaction.input.slice(0, 10)}
                  </code>
                )}
              </dd>
            </div>
            <div className="bqs-data-row">
              <dt>Giá gas</dt>
              <dd>{formatUnits(transaction.gasPrice ?? 0n, 9)} Gwei</dd>
            </div>
            <div className="bqs-data-row">
              <dt>Dữ liệu đầu vào</dt>
              <dd>
                <textarea
                  aria-label="Dữ liệu đầu vào của giao dịch"
                  readOnly
                  value={transaction.input}
                  className="textarea w-full min-h-32 bqs-code"
                />
              </dd>
            </div>
            <div className="bqs-data-row">
              <dt>Nhật ký sự kiện</dt>
              <dd>
                {receipt?.logs.length ? (
                  <details>
                    <summary className="cursor-pointer text-primary">Xem {receipt.logs.length} sự kiện</summary>
                    <pre className="bqs-explorer-code mt-3 bg-base-200 rounded-box">
                      {JSON.stringify(receipt.logs, replacer, 2)}
                    </pre>
                  </details>
                ) : (
                  "Không có sự kiện."
                )}
              </dd>
            </div>
          </dl>
        </section>
      )}
    </div>
  );
};
export default TransactionComp;
