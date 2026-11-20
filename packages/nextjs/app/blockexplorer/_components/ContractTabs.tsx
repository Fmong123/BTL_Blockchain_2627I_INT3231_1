"use client";

import { useEffect, useState } from "react";
import { AddressCodeTab } from "./AddressCodeTab";
import { AddressLogsTab } from "./AddressLogsTab";
import { AddressStorageTab } from "./AddressStorageTab";
import { PaginationButton } from "./PaginationButton";
import { TransactionsTable } from "./TransactionsTable";
import { Address, createPublicClient, http } from "viem";
import { hardhat } from "viem/chains";
import { useFetchBlocks } from "~~/hooks/scaffold-eth";

type AddressCodeTabProps = {
  bytecode: string;
  assembly: string;
};

type PageProps = {
  address: Address;
  contractData: AddressCodeTabProps | null;
};

const publicClient = createPublicClient({
  chain: hardhat,
  transport: http(),
});

export const ContractTabs = ({ address, contractData }: PageProps) => {
  const { blocks, transactionReceipts, currentPage, hasNextPage, setCurrentPage, error } = useFetchBlocks(address);
  const [activeTab, setActiveTab] = useState("transactions");
  const [isContract, setIsContract] = useState(false);
  const [codeError, setCodeError] = useState(false);

  useEffect(() => {
    let active = true;
    const checkIsContract = async () => {
      try {
        const contractCode = await publicClient.getCode({ address });
        if (active) {
          setIsContract(Boolean(contractCode && contractCode !== "0x"));
          setCodeError(false);
        }
      } catch {
        if (active) setCodeError(true);
      }
    };

    checkIsContract();
    return () => {
      active = false;
    };
  }, [address]);

  return (
    <>
      {(error || codeError) && (
        <div role="alert" className="alert alert-error mb-5">
          Không đọc được dữ liệu địa chỉ. Kiểm tra blockchain local và tải lại trang.
        </div>
      )}
      {isContract && (
        <div role="tablist" aria-label="Dữ liệu địa chỉ" className="tabs bqs-tabs">
          <button
            role="tab"
            aria-selected={activeTab === "transactions"}
            className={`tab ${activeTab === "transactions" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("transactions")}
          >
            Giao dịch
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "code"}
            className={`tab ${activeTab === "code" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("code")}
          >
            Mã contract
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "storage"}
            className={`tab  ${activeTab === "storage" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("storage")}
          >
            Bộ nhớ
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "logs"}
            className={`tab  ${activeTab === "logs" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("logs")}
          >
            Nhật ký
          </button>
        </div>
      )}
      {activeTab === "transactions" && !error && (
        <div className="pt-4">
          <TransactionsTable blocks={blocks} transactionReceipts={transactionReceipts} />
          <PaginationButton currentPage={currentPage} hasNextPage={hasNextPage} setCurrentPage={setCurrentPage} />
        </div>
      )}
      {activeTab === "code" &&
        (contractData?.bytecode ? (
          <AddressCodeTab bytecode={contractData.bytecode} assembly={contractData.assembly} />
        ) : (
          <p role="status" className="p-5">
            Chưa có dữ liệu biên dịch để hiển thị mã contract.
          </p>
        ))}
      {activeTab === "storage" && <AddressStorageTab address={address} />}
      {activeTab === "logs" && <AddressLogsTab address={address} />}
    </>
  );
};
