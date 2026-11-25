import { notFound, redirect } from "next/navigation";
import TransactionComp from "../_components/TransactionComp";
import type { NextPage } from "next";
import { Hash } from "viem";
import { hardhat } from "viem/chains";
import { copyrightChain } from "~~/copyright.config";
import { isZeroAddress } from "~~/utils/scaffold-eth/common";

type PageProps = {
  params: Promise<{ txHash?: Hash }>;
};

export function generateStaticParams() {
  // An workaround to enable static exports in Next.js, generating single dummy page.
  return [{ txHash: "0x0000000000000000000000000000000000000000" }];
}
const TransactionPage: NextPage<PageProps> = async (props: PageProps) => {
  const params = await props.params;
  const txHash = params?.txHash as Hash;

  if (isZeroAddress(txHash)) return null;
  if (!/^0x[0-9a-fA-F]{64}$/.test(txHash)) notFound();
  if (copyrightChain.id !== hardhat.id) redirect(copyrightChain.blockExplorers.default.url + "/tx/" + txHash);

  return <TransactionComp txHash={txHash} />;
};

export default TransactionPage;
