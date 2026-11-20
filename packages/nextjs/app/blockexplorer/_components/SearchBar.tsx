"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { parseExplorerSearch } from "~~/utils/explorer";

export const SearchBar = () => {
  const [searchInput, setSearchInput] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  function handleSearch(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      const result = parseExplorerSearch(searchInput);
      router.push(`/blockexplorer/${result.kind === "address" ? "address" : "transaction"}/${result.value}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Thông tin tra cứu không hợp lệ.");
    }
  }
  return (
    <div className="mb-6">
      <form onSubmit={handleSearch} className="bqs-explorer-search !mb-0">
        <label>
          <span className="label">Hash giao dịch hoặc địa chỉ ví</span>
          <input
            className="input input-bordered font-mono"
            value={searchInput}
            placeholder="0x…"
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "explorer-search-error" : undefined}
            onChange={event => {
              setSearchInput(event.target.value);
              setError("");
            }}
          />
        </label>
        <button className="btn btn-primary" type="submit">
          Tra cứu
        </button>
      </form>
      {error && (
        <p id="explorer-search-error" role="alert" className="mb-0 text-error">
          {error}
        </p>
      )}
    </div>
  );
};
