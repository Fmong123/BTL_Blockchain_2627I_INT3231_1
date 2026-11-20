import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";

type PaginationButtonProps = { currentPage: number; hasNextPage: boolean; setCurrentPage: (page: number) => void };
export const PaginationButton = ({ currentPage, hasNextPage, setCurrentPage }: PaginationButtonProps) => {
  if (!hasNextPage && currentPage === 0) return null;
  return (
    <nav aria-label="Phân trang giao dịch" className="mt-6 flex flex-wrap items-center justify-end gap-4">
      <button
        className="btn btn-outline btn-sm"
        aria-label="Trang trước"
        disabled={currentPage === 0}
        onClick={() => setCurrentPage(currentPage - 1)}
      >
        <ArrowLeftIcon className="h-4 w-4" />
      </button>
      <span>Trang {currentPage + 1}</span>
      <button
        className="btn btn-outline btn-sm"
        aria-label="Trang sau"
        disabled={!hasNextPage}
        onClick={() => setCurrentPage(currentPage + 1)}
      >
        <ArrowRightIcon className="h-4 w-4" />
      </button>
    </nav>
  );
};
