"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Notice } from "~~/components/copyright/Notice";
import { notification } from "~~/utils/scaffold-eth";
import { publicUrl, verificationPath } from "~~/utils/shareLinks";

export function WorkSharePanel({ fileHash }: { fileHash: `0x${string}` }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    setUrl(publicUrl(window.location.href, verificationPath(fileHash)));
  }, [fileHash]);

  return (
    <details className="bqs-lookup-summary mt-5">
      <summary>Chia sẻ trang xác minh</summary>
      {url && (
        <div className="bqs-lookup-body bqs-share-layout">
          <QRCodeSVG value={url} size={176} marginSize={4} title="QR mở trang xác minh tác phẩm" />
          <div className="min-w-0 flex-1 basis-56 space-y-3">
            <p className="m-0">Người nhận có thể xem bản ghi và giấy phép mà không cần kết nối ví.</p>
            <a className="link block break-all" href={url}>
              {url}
            </a>
            <div className="bqs-actions">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(url);
                    notification.success("Đã sao chép liên kết xác minh.");
                  } catch {
                    notification.error("Không sao chép được. Hãy chọn và sao chép liên kết bên trên.");
                  }
                }}
              >
                Sao chép liên kết
              </button>
            </div>
            <Notice title="Lưu ý khi chia sẻ">
              Với địa chỉ localhost, liên kết và QR chỉ mở được trên máy đang chạy ứng dụng.
            </Notice>
          </div>
        </div>
      )}
    </details>
  );
}
