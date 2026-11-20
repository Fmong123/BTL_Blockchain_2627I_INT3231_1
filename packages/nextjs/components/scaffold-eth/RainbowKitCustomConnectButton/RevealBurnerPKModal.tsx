import { useRef } from "react";
import { rainbowkitBurnerWallet } from "burner-connector";
import { ShieldExclamationIcon } from "@heroicons/react/24/outline";
import { useCopyToClipboard } from "~~/hooks/scaffold-eth";
import { getParsedError, notification } from "~~/utils/scaffold-eth";

const BURNER_WALLET_PK_KEY = "burnerWallet.pk";

export const RevealBurnerPKModal = () => {
  const { copyToClipboard, isCopiedToClipboard } = useCopyToClipboard();
  const modalCheckboxRef = useRef<HTMLInputElement>(null);

  const handleCopyPK = async () => {
    try {
      const storage = rainbowkitBurnerWallet.useSessionStorage ? sessionStorage : localStorage;
      const burnerPK = storage?.getItem(BURNER_WALLET_PK_KEY);
      if (!burnerPK) throw new Error("Không tìm thấy khóa của ví thử nghiệm.");
      await copyToClipboard(burnerPK);
      notification.success("Đã sao chép khóa ví thử nghiệm.");
    } catch (e) {
      const parsedError = getParsedError(e);
      notification.error(parsedError);
      if (modalCheckboxRef.current) modalCheckboxRef.current.checked = false;
    }
  };

  return (
    <>
      <div>
        <input type="checkbox" id="reveal-burner-pk-modal" className="modal-toggle" ref={modalCheckboxRef} />
        <label htmlFor="reveal-burner-pk-modal" className="modal cursor-pointer">
          <label className="modal-box relative">
            {/* dummy input to capture event onclick on modal box */}
            <input className="h-0 w-0 absolute top-0 left-0" />
            <label htmlFor="reveal-burner-pk-modal" className="btn btn-ghost btn-sm absolute right-3 top-3">
              ✕
            </label>
            <div>
              <h2 className="m-0 p-0 pr-8">Khóa ví thử nghiệm</h2>
              <div role="alert" className="alert alert-warning mt-4">
                <ShieldExclamationIcon className="h-6 w-6" />
                <span className="font-semibold">
                  Ví thử nghiệm chỉ dùng để phát triển local. Không dùng ví này để giữ tài sản thật.
                </span>
              </div>
              <p>
                Khóa bí mật cho phép <strong>toàn quyền truy cập</strong> ví và tài sản trong ví. Khóa của ví thử nghiệm
                được lưu trong trình duyệt.
              </p>
              <button className="btn btn-outline btn-error" onClick={handleCopyPK} disabled={isCopiedToClipboard}>
                Sao chép khóa bí mật
              </button>
            </div>
          </label>
        </label>
      </div>
    </>
  );
};
