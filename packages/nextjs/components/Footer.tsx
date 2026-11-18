import Link from "next/link";
import { SwitchTheme } from "~~/components/SwitchTheme";

export const Footer = () => (
  <footer className="border-t border-base-300 px-4 py-6 sm:px-6">
    <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 text-sm text-base-content/70">
      <div>
        <p className="m-0 font-semibold text-base-content">Bản Quyền Số · Demo nền tảng</p>
        <p className="mb-0 mt-1 text-xs">Ghi nhận hash trên blockchain · File gốc ở thiết bị của bạn</p>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/blockexplorer" className="link link-hover">
          Tra cứu giao dịch
        </Link>
        <a
          href="https://github.com/scaffold-eth/scaffold-eth-2"
          target="_blank"
          rel="noreferrer"
          className="link link-hover"
        >
          Scaffold-ETH 2
        </a>
        <SwitchTheme />
      </div>
    </div>
  </footer>
);
