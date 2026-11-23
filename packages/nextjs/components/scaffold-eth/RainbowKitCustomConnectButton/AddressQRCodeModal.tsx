import { Address } from "@scaffold-ui/components";
import { QRCodeSVG } from "qrcode.react";
import { Address as AddressType } from "viem";

type AddressQRCodeModalProps = {
  address: AddressType;
  modalId: string;
};

export const AddressQRCodeModal = ({ address, modalId }: AddressQRCodeModalProps) => {
  return (
    <>
      <div>
        <input type="checkbox" id={`${modalId}`} className="modal-toggle" />
        <label htmlFor={`${modalId}`} className="modal cursor-pointer">
          <label className="modal-box relative">
            {/* dummy input to capture event onclick on modal box */}
            <input className="h-0 w-0 absolute top-0 left-0" />
            <label
              htmlFor={`${modalId}`}
              aria-label="Đóng mã QR"
              className="btn btn-ghost btn-sm absolute right-3 top-3"
            >
              ✕
            </label>
            <div className="space-y-3 py-6">
              <h2 className="text-center mb-5">Mã QR địa chỉ ví</h2>
              <div className="bqs-qr-code flex flex-col items-center gap-6">
                <QRCodeSVG value={address} size={256} />
                <div className="bqs-address-value w-full flex justify-center">
                  <Address address={address} format="long" size="base" disableAddressLink onlyEnsOrAddress />
                </div>
              </div>
            </div>
          </label>
        </label>
      </div>
    </>
  );
};
