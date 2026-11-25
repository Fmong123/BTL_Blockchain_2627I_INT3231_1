import type { WorkDetails } from "~~/utils/copyrightDetails";

export function editableWorkDetails<T extends Record<keyof WorkDetails, unknown>>(
  details: T,
): Pick<T, keyof WorkDetails> {
  return {
    category: details.category,
    language: details.language,
    creationDate: details.creationDate,
    publicationDate: details.publicationDate,
    parties: details.parties,
    basis: details.basis,
    certificate: details.certificate,
    experienceUrl: details.experienceUrl,
  };
}
