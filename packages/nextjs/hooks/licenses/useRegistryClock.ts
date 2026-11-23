import { useBlock } from "wagmi";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";

export function useRegistryClock() {
  const { targetNetwork } = useTargetNetwork();
  return useBlock({ chainId: targetNetwork.id, watch: true, query: { refetchInterval: 3000, retry: false } });
}
