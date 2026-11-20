"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { ReceivedLicenses } from "~~/components/licenses/ReceivedLicenses";
import { WorkCatalog } from "~~/components/works/WorkCatalog";

export function MyLibrary() {
  const { address } = useAccount();
  const [tab, setTab] = useState("works");
  return (
    <>
      <div role="tablist" aria-label="Quản lý của tôi" className="tabs bqs-tabs mt-6">
        <button
          role="tab"
          aria-selected={tab === "works"}
          className={`tab ${tab === "works" ? "tab-active" : ""}`}
          onClick={() => setTab("works")}
        >
          Tác phẩm đăng ký
        </button>
        <button
          role="tab"
          aria-selected={tab === "licenses"}
          className={`tab ${tab === "licenses" ? "tab-active" : ""}`}
          onClick={() => setTab("licenses")}
        >
          Giấy phép nhận
        </button>
      </div>
      {!address ? (
        <div role="status" className="alert alert-info mt-6">
          Kết nối ví ở đầu trang để xem tác phẩm và giấy phép của bạn.
        </div>
      ) : (
        <div role="tabpanel" key={`${address}:${tab}`}>
          {tab === "works" ? <WorkCatalog mine /> : <ReceivedLicenses />}
        </div>
      )}
    </>
  );
}
