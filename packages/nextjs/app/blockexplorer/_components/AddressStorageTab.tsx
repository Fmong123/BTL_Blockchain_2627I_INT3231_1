"use client";

import { useEffect, useState } from "react";
import { Address, createPublicClient, http, toHex } from "viem";
import { hardhat } from "viem/chains";

const publicClient = createPublicClient({ chain: hardhat, transport: http() });
const STORAGE_SLOTS_TO_DISPLAY = 16;
export const AddressStorageTab = ({ address }: { address: Address }) => {
  const [storage, setStorage] = useState<string[]>();
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    Promise.all(
      Array.from({ length: STORAGE_SLOTS_TO_DISPLAY }, (_, index) =>
        publicClient.getStorageAt({ address, slot: toHex(index) }),
      ),
    )
      .then(values => {
        if (active) {
          setStorage(values.map(value => value ?? "0x"));
          setError(false);
        }
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [address]);
  if (error)
    return (
      <p role="alert" className="alert alert-error mt-5">
        Không đọc được bộ nhớ contract. Hãy tải lại trang để thử lại.
      </p>
    );
  if (!storage)
    return (
      <p role="status" className="mt-5">
        Đang đọc bộ nhớ contract…
      </p>
    );
  return (
    <section className="mt-5 space-y-4">
      <p className="text-base-content/70">
        Hiển thị {STORAGE_SLOTS_TO_DISPLAY} ô nhớ đầu tiên; dữ liệu mapping không được liệt kê đầy đủ ở đây.
      </p>
      <div className="bqs-explorer-panel">
        <pre className="bqs-explorer-code">{storage.map((value, index) => `Slot ${index}: ${value}`).join("\n")}</pre>
      </div>
    </section>
  );
};
