"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { hardhat } from "viem/chains";
import { FingerPrintIcon, FolderIcon, QrCodeIcon, Square3Stack3DIcon } from "@heroicons/react/24/outline";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";

export const menuLinks = [
  { label: "Tác phẩm", href: "/works", Icon: Square3Stack3DIcon },
  { label: "Quản lý của tôi", href: "/my", Icon: FolderIcon },
  { label: "Xác minh", href: "/works/verify", Icon: QrCodeIcon },
];

export const HeaderMenuLinks = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isDetail = pathname === "/works/verify" && Boolean(searchParams.get("hash"));
  return menuLinks.map(({ label, href, Icon }) => {
    const isActive =
      (pathname === href && !isDetail) ||
      (href === "/works" && (isDetail || pathname === "/" || pathname === "/works/register"));
    return (
      <Link key={href} href={href} className="bqs-nav-link" aria-current={isActive ? "page" : undefined}>
        <Icon aria-hidden="true" />
        {label}
      </Link>
    );
  });
};

export const Header = () => {
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;
  return (
    <header className="bqs-header">
      <div className="bqs-header-top">
        <Link href="/works" className="bqs-brand" aria-label="Bản Quyền Số, về danh sách tác phẩm">
          <span className="bqs-brand-mark">
            <FingerPrintIcon aria-hidden="true" />
          </span>
          <span className="bqs-brand-name">
            Bản Quyền Số<span className="bqs-brand-caption">Ghi nhận · Xác minh · Cấp phép</span>
          </span>
        </Link>
        <div className="bqs-wallet">
          <span className="bqs-network">{isLocalNetwork ? "Local" : targetNetwork.name}</span>
          <RainbowKitCustomConnectButton />
          {isLocalNetwork && <FaucetButton />}
        </div>
      </div>
      <nav className="bqs-nav" aria-label="Điều hướng chính">
        <Suspense fallback={null}>
          <HeaderMenuLinks />
        </Suspense>
      </nav>
    </header>
  );
};
