import { TransactionHash } from "./TransactionHash";
import { Address } from "@scaffold-ui/components";
import { formatEther } from "viem";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";
import { formatVietnamTimestamp } from "~~/utils/licenses";
import { TransactionWithFunction, TransactionsTableProps } from "~~/utils/scaffold-eth";

export const TransactionsTable = ({ blocks, transactionReceipts }: TransactionsTableProps) => {
  const { targetNetwork } = useTargetNetwork();
  const hasTransactions = blocks.some(block => block.transactions.length > 0);
  return (
    <div className="bqs-table-scroll" tabIndex={0} role="region" aria-label="Danh sách giao dịch, có thể cuộn ngang">
      {!hasTransactions ? (
        <p role="status" className="m-0 p-6 text-base-content/70">
          Chưa có giao dịch trong trang này.
        </p>
      ) : (
        <table className="table bqs-transactions-table">
          <thead>
            <tr>
              <th>Hash giao dịch</th>
              <th>Thao tác</th>
              <th>Khối</th>
              <th>Thời gian (VN)</th>
              <th>Ví gửi</th>
              <th>Địa chỉ nhận</th>
              <th className="text-right">Giá trị ({targetNetwork.nativeCurrency.symbol})</th>
            </tr>
          </thead>
          <tbody>
            {blocks.flatMap(block =>
              (block.transactions as TransactionWithFunction[]).map(tx => {
                const receipt = transactionReceipts[tx.hash];
                return (
                  <tr key={tx.hash}>
                    <td>
                      <TransactionHash hash={tx.hash} />
                    </td>
                    <td>
                      <span>
                        {receipt?.contractAddress
                          ? "Triển khai contract"
                          : tx.input === "0x"
                            ? "Chuyển ETH"
                            : tx.functionName === "⚠️ Unknown"
                              ? "Hàm chưa xác định"
                              : (tx.functionName ?? tx.input.slice(0, 10))}
                      </span>
                    </td>
                    <td>{block.number?.toString()}</td>
                    <td>{formatVietnamTimestamp(block.timestamp)}</td>
                    <td>
                      <Address address={tx.from} size="sm" onlyEnsOrAddress chain={targetNetwork} />
                    </td>
                    <td>
                      <Address
                        address={receipt?.contractAddress ?? tx.to ?? undefined}
                        size="sm"
                        onlyEnsOrAddress
                        chain={targetNetwork}
                      />
                    </td>
                    <td className="text-right whitespace-nowrap">{formatEther(tx.value)}</td>
                  </tr>
                );
              }),
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};
