"use client";

import { ContractTabs } from "./ContractTabs";
import { Address, Balance } from "@scaffold-ui/components";
import { Address as AddressType } from "viem";
import { PageHeader } from "~~/components/PageHeader";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";

export const AddressComponent = ({
  address,
  contractData,
}: {
  address: AddressType;
  contractData: { bytecode: string; assembly: string } | null;
}) => {
  const { targetNetwork } = useTargetNetwork();
  return (
    <div className="bqs-page">
      <PageHeader
        title="Chi tiết địa chỉ"
        description="Số dư và lịch sử hoạt động của địa chỉ trên mạng local."
        backHref="/blockexplorer"
        backLabel="Tra cứu giao dịch"
      />
      <section className="bqs-explorer-panel mb-6" aria-label="Thông tin địa chỉ">
        <dl className="bqs-data-list">
          <div className="bqs-data-row">
            <dt>Địa chỉ ví / contract</dt>
            <dd className="bqs-address-value">
              <Address address={address} format="long" size="base" onlyEnsOrAddress chain={targetNetwork} />
            </dd>
          </div>
          <div className="bqs-data-row">
            <dt>Số dư</dt>
            <dd>
              <Balance address={address} />
            </dd>
          </div>
        </dl>
      </section>
      <ContractTabs key={address} address={address} contractData={contractData} />
    </div>
  );
};
