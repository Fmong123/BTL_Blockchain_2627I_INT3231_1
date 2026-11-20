import { useQuery } from "@tanstack/react-query";
import { useScaffoldContract, useScaffoldEventHistory } from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";
import type { RegisteredWork } from "~~/utils/works";

export function useRegisteredWorks() {
  const { targetNetwork } = useTargetNetwork();
  const { data: contract, isLoading: isContractLoading } = useScaffoldContract({ contractName: "WorkRegistry" });
  // eslint-disable-next-line @typescript-eslint/no-deprecated -- Event history is scoped to the local demo.
  const events = useScaffoldEventHistory({ contractName: "WorkRegistry", eventName: "WorkRegistered" });
  const hashes = events.data.flatMap(event => (event.args.fileHash ? [event.args.fileHash] : []));
  const records = useQuery({
    queryKey: ["registeredWorks", targetNetwork.id, contract?.address, hashes],
    enabled: Boolean(contract) && events.status === "success",
    queryFn: async (): Promise<RegisteredWork[]> => {
      if (!contract) throw new Error("Chưa kết nối được contract.");
      return Promise.all(
        hashes.map(async fileHash => {
          const [registrant, registeredAt, title, description, workType] = await contract.read.works([fileHash]);
          if (workType !== 0 && workType !== 1 && workType !== 2) throw new Error("Loại tác phẩm không hợp lệ.");
          return { fileHash, registrant, registeredAt, title, description, workType };
        }),
      );
    },
    retry: false,
  });

  return {
    works: records.data ?? [],
    isLoading: isContractLoading || events.status === "pending" || records.isPending,
    error: events.error || records.error || (!isContractLoading && !contract ? new Error("Chưa có contract.") : null),
    async refresh() {
      if (!contract) {
        window.location.reload();
        return;
      }
      await events.refetch();
      await records.refetch();
    },
  };
}
