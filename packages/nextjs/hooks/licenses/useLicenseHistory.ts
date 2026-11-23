import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useScaffoldContract, useScaffoldEventHistory, useTargetNetwork } from "~~/hooks/scaffold-eth";
import type { License } from "~~/utils/licenses";

type LicenseFilters = { fileHash?: `0x${string}`; licensee?: string; enabled?: boolean };

export function useLicenseHistory({ fileHash, licensee, enabled = true }: LicenseFilters) {
  const { targetNetwork } = useTargetNetwork();
  const queryClient = useQueryClient();
  const { data: contract, isLoading: isContractLoading } = useScaffoldContract({ contractName: "WorkRegistry" });
  const filters = fileHash ? { fileHash } : licensee ? { licensee } : undefined;
  // eslint-disable-next-line @typescript-eslint/no-deprecated -- Event history is scoped to the local demo.
  const grants = useScaffoldEventHistory({
    contractName: "WorkRegistry",
    eventName: "LicenseGranted",
    filters,
    enabled,
  });
  // eslint-disable-next-line @typescript-eslint/no-deprecated -- Event history is scoped to the local demo.
  const revocations = useScaffoldEventHistory({
    contractName: "WorkRegistry",
    eventName: "LicenseRevoked",
    filters,
    enabled,
  });
  const ids = grants.data.flatMap(event => (event.args.licenseId ? [event.args.licenseId] : []));
  const records = useQuery({
    queryKey: ["licenses", targetNetwork.id, contract?.address, fileHash, licensee, ids.map(id => id.toString())],
    enabled: enabled && Boolean(contract) && grants.status === "success",
    queryFn: async (): Promise<License[]> => {
      if (!contract) throw new Error("Chưa kết nối được contract.");
      return Promise.all(
        ids.map(async id => {
          const [hash, licensor, recipient, grantedAt, expiresAt, revoked] = await contract.read.licenses([id]);
          return { id, fileHash: hash, licensor, licensee: recipient, grantedAt, expiresAt, revoked };
        }),
      );
    },
    refetchInterval: 3000,
    retry: false,
  });

  return {
    licenses: records.data ?? [],
    grantEvents: grants.data,
    revokeEvents: revocations.data,
    isLoading: enabled && (isContractLoading || grants.status === "pending" || records.isPending),
    error:
      grants.error ||
      revocations.error ||
      records.error ||
      (!isContractLoading && !contract ? new Error("Chưa có contract.") : null),
    async refresh() {
      if (!contract) {
        window.location.reload();
        return;
      }
      await Promise.all([grants.refetch({ throwOnError: true }), revocations.refetch({ throwOnError: true })]);
      await queryClient.invalidateQueries({ queryKey: ["licenses"] }, { throwOnError: true });
    },
  };
}
