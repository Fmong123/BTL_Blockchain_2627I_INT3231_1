export type RegisteredWork = {
  fileHash: `0x${string}`;
  registrant: string;
  registeredAt: bigint;
  title: string;
  description: string;
  workType: 0 | 1 | 2;
};

export type WorkFilters = {
  query?: string;
  workType?: number;
  registrant?: string;
};

export const WORKS_PAGE_SIZE = 10;

export function getWorkPage(works: RegisteredWork[], filters: WorkFilters, requestedPage: number) {
  const query = filters.query?.trim().toLocaleLowerCase("vi") ?? "";
  const filtered = works.filter(work => {
    if (filters.registrant && work.registrant.toLowerCase() !== filters.registrant.toLowerCase()) return false;
    if (filters.workType !== undefined && filters.workType !== work.workType) return false;
    return (
      !query ||
      [work.title, work.registrant, work.fileHash].some(value => value.toLocaleLowerCase("vi").includes(query))
    );
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / WORKS_PAGE_SIZE));
  const page = Math.max(1, Math.min(requestedPage, totalPages));
  return {
    items: filtered.slice((page - 1) * WORKS_PAGE_SIZE, page * WORKS_PAGE_SIZE),
    total: filtered.length,
    totalPages,
    page,
  };
}
