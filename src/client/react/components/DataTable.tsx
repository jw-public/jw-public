import * as React from "react";
import { useMemo, useState } from "react";

// React replacement for aldeed:tabular (jQuery DataTables). Renders the same
// DOM classes (dataTables_wrapper, dataTables_filter, …) so existing styling
// and tests keep working. Data is fully client-side — the collections behind
// these tables are small (one congregation's users/assignments).

export interface DataTableColumn<T> {
  title: string;
  render: (doc: T) => React.ReactNode;
  /** Value used for sorting; omit to make the column unsortable. */
  sortValue?: (doc: T) => string | number | Date;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (doc: T) => string;
  /** Text blob per row that the search box filters on. */
  searchText: (doc: T) => string;
  defaultSort?: { column: number; direction: "asc" | "desc" };
  tableClassName?: string;
  rowClassName?: (doc: T) => string;
}

const PAGE_SIZES = [10, 25, 50, 100];

export default function DataTable<T>(props: DataTableProps<T>): JSX.Element {
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<{ column: number; direction: "asc" | "desc" } | null>(
    props.defaultSort ?? null,
  );

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    let rows = needle
      ? props.rows.filter((r) => props.searchText(r).toLowerCase().includes(needle))
      : [...props.rows];

    if (sort && props.columns[sort.column]?.sortValue) {
      const value = props.columns[sort.column].sortValue!;
      rows.sort((a, b) => {
        const va = value(a);
        const vb = value(b);
        const cmp = va < vb ? -1 : va > vb ? 1 : 0;
        return sort.direction === "asc" ? cmp : -cmp;
      });
    }
    return rows;
  }, [props.rows, search, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  const first = filtered.length === 0 ? 0 : currentPage * pageSize + 1;
  const last = Math.min(filtered.length, (currentPage + 1) * pageSize);

  const onHeaderClick = (index: number) => {
    if (!props.columns[index].sortValue) {
      return;
    }
    setSort((current) =>
      current && current.column === index
        ? { column: index, direction: current.direction === "asc" ? "desc" : "asc" }
        : { column: index, direction: "asc" },
    );
  };

  const sortClass = (index: number): string => {
    if (!props.columns[index].sortValue) {
      return "";
    }
    if (sort && sort.column === index) {
      return sort.direction === "asc" ? "sorting_asc" : "sorting_desc";
    }
    return "sorting";
  };

  return (
    <div className="dataTables_wrapper form-inline dt-bootstrap no-footer">
      <div className="row">
        <div className="col-sm-6">
          <div className="dataTables_length">
            <label>
              Show{" "}
              <select
                className="form-control input-sm"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(0);
                }}
              >
                {PAGE_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>{" "}
              entries
            </label>
          </div>
        </div>
        <div className="col-sm-6">
          <div className="dataTables_filter">
            <label>
              Search:{" "}
              <input
                type="search"
                className="form-control input-sm"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
              />
            </label>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-sm-12">
          <table className={props.tableClassName ?? "table table-striped table-bordered"}>
            <thead>
              <tr>
                {props.columns.map((c, i) => (
                  <th
                    key={i}
                    className={sortClass(i)}
                    style={props.columns[i].sortValue ? { cursor: "pointer" } : undefined}
                    onClick={() => onHeaderClick(i)}
                  >
                    {c.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => (
                <tr
                  key={props.rowKey(row)}
                  className={props.rowClassName ? props.rowClassName(row) : undefined}
                >
                  {props.columns.map((c, i) => (
                    <td key={i}>{c.render(row)}</td>
                  ))}
                </tr>
              ))}
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={props.columns.length} className="text-center">
                    No matching records found
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
      <div className="row">
        <div className="col-sm-5">
          <div className="dataTables_info">
            Showing {first} to {last} of {filtered.length} entries
          </div>
        </div>
        <div className="col-sm-7">
          <div className="dataTables_paginate paging_simple_numbers">
            <ul className="pagination">
              <li className={`paginate_button previous${currentPage === 0 ? " disabled" : ""}`}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage(Math.max(0, currentPage - 1));
                  }}
                >
                  Previous
                </a>
              </li>
              {Array.from({ length: pageCount }, (_, i) => (
                <li key={i} className={`paginate_button${i === currentPage ? " active" : ""}`}>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPage(i);
                    }}
                  >
                    {i + 1}
                  </a>
                </li>
              ))}
              <li
                className={`paginate_button next${currentPage >= pageCount - 1 ? " disabled" : ""}`}
              >
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage(Math.min(pageCount - 1, currentPage + 1));
                  }}
                >
                  Next
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
