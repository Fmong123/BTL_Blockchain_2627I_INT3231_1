import { Address } from "viem";
import { useContractLogs } from "~~/hooks/scaffold-eth";
import { replacer } from "~~/utils/scaffold-eth/common";

export const AddressLogsTab = ({ address }: { address: Address }) => {
  const logs = useContractLogs(address);
  return (
    <section className="bqs-explorer-panel mt-5">
      <pre className="bqs-explorer-code">
        {logs.length ? JSON.stringify(logs, replacer, 2) : "Chưa có sự kiện được đọc từ địa chỉ này."}
      </pre>
    </section>
  );
};
