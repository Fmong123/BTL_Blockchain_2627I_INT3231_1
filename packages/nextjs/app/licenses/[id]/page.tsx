import { notFound } from "next/navigation";
import { LicenseDocument } from "~~/components/licenses/LicenseDocument";
import { parseLicenseId, parseLicenseIdentity } from "~~/utils/shareLinks";

export default async function LicensePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const licenseId = parseLicenseId(id);
  const identity = parseLicenseIdentity(await searchParams);
  if (licenseId === undefined || identity === null) notFound();
  return <LicenseDocument key={`${id}:${identity?.block ?? ""}`} id={licenseId} expectedIdentity={identity} />;
}
