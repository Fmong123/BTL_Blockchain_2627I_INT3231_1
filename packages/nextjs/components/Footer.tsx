import Link from "next/link";
import { SwitchTheme } from "~~/components/SwitchTheme";

export const Footer = () => (
  <footer className="bqs-footer">
    <span>Bản Quyền Số</span>
    <div className="bqs-footer-links">
      <Link href="/debug" className="link link-hover">
        Công cụ contract
      </Link>
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
  </footer>
);
