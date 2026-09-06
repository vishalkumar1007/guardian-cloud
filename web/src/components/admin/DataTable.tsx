import React, { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  flexRender,
} from '@tanstack/react-table'
import {
  Search,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { cn } from '../../lib/utils'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  searchPlaceholder?: string
  filterOptions?: Array<{
    id: string
    label: string
    options: Array<{ label: string; value: string }>
  }>
  toolbarActions?: React.ReactNode
  pageSizeDefault?: number
  onRowClick?: (row: TData) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = 'Search records…',
  filterOptions = [],
  toolbarActions,
  pageSizeDefault = 10,
  onRowClick,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState('')
  const [showColumnsMenu, setShowColumnsMenu] = useState(false)

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter: searchKey ? undefined : globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: pageSizeDefault,
      },
    },
  })

  return (
    <div className="space-y-3">
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto flex-1 max-w-xl">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-soft" />
            <input
              type="text"
              value={
                searchKey
                  ? ((table.getColumn(searchKey)?.getFilterValue() as string) ?? '')
                  : globalFilter
              }
              onChange={(e) => {
                if (searchKey) {
                  table.getColumn(searchKey)?.setFilterValue(e.target.value)
                } else {
                  setGlobalFilter(e.target.value)
                }
              }}
              placeholder={searchPlaceholder}
              className="h-9 w-full rounded-lg border border-line bg-surface pl-9 pr-8 text-xs text-ink placeholder:text-ink-soft focus:border-signal/80 focus:outline-none focus:ring-1 focus:ring-signal/50"
            />
            {((searchKey ? table.getColumn(searchKey)?.getFilterValue() : globalFilter) as string) && (
              <button
                type="button"
                onClick={() => {
                  if (searchKey) table.getColumn(searchKey)?.setFilterValue('')
                  else setGlobalFilter('')
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          {filterOptions.map((f) => {
            const currentVal = (table.getColumn(f.id)?.getFilterValue() as string) ?? ''
            return (
              <select
                key={f.id}
                value={currentVal}
                onChange={(e) => table.getColumn(f.id)?.setFilterValue(e.target.value || undefined)}
                className="h-9 rounded-lg border border-line bg-surface px-2.5 text-xs text-ink focus:border-signal/80 focus:outline-none cursor-pointer"
              >
                <option value="">{f.label}: All</option>
                {f.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )
          })}
        </div>

        {/* Right actions: Column visibility & custom toolbar actions */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColumnsMenu(!showColumnsMenu)}
              className="flex items-center gap-1.5 h-9 rounded-lg border border-line bg-surface px-3 text-xs text-ink hover:bg-surface-2/80 transition-colors"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-ink-soft" />
              <span>Columns</span>
            </button>

            {showColumnsMenu && (
              <div className="absolute right-0 top-11 z-30 w-44 rounded-xl border border-line bg-surface p-2 shadow-xl">
                <div className="text-[10px] font-mono uppercase tracking-wider text-ink-soft px-2 py-1 font-semibold">
                  Toggle Columns
                </div>
                <div className="space-y-1 max-h-56 overflow-y-auto pt-1">
                  {table
                    .getAllColumns()
                    .filter((column) => typeof column.accessorFn !== 'undefined' && column.getCanHide())
                    .map((column) => {
                      return (
                        <label
                          key={column.id}
                          className="flex items-center gap-2 px-2 py-1 text-xs text-ink hover:bg-surface-2 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={column.getIsVisible()}
                            onChange={(e) => column.toggleVisibility(e.target.checked)}
                            className="rounded border-line bg-surface-2 text-signal focus:ring-0"
                          />
                          <span className="capitalize">{column.id}</span>
                        </label>
                      )
                    })}
                </div>
              </div>
            )}
          </div>

          {toolbarActions}
        </div>
      </div>

      {/* Main Table Container */}
      <div className="overflow-hidden rounded-xl border border-line/80 bg-surface/90 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line bg-surface-2 font-mono text-[11px] uppercase tracking-wider text-ink-soft">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort()
                    const isSorted = header.column.getIsSorted()
                    return (
                      <th
                        key={header.id}
                        className={cn(
                          'px-4 py-3 font-semibold select-none',
                          canSort && 'cursor-pointer hover:text-ink',
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <div className="flex items-center gap-1.5">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {canSort && (
                            <span className="text-ink-soft">
                              {isSorted === 'asc' && <ChevronUp className="h-3.5 w-3.5 text-signal" />}
                              {isSorted === 'desc' && <ChevronDown className="h-3.5 w-3.5 text-signal" />}
                              {!isSorted && <ChevronsUpDown className="h-3 w-3 opacity-40" />}
                            </span>
                          )}
                        </div>
                      </th>
                    )
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-line text-ink">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => onRowClick && onRowClick(row.original)}
                    className={cn(
                      'transition-colors hover:bg-surface-2',
                      onRowClick && 'cursor-pointer',
                      row.getIsSelected() && 'bg-signal/10',
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3.5 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="h-32 text-center text-ink-soft">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <span className="font-mono text-sm">No records found</span>
                      <span className="text-xs text-ink-soft">Try adjusting your search query or filters.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-line/80 px-4 py-3 text-xs text-ink-soft font-mono">
          <div className="flex items-center gap-2">
            <span>
              Showing{' '}
              <strong className="text-ink">
                {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
              </strong>{' '}
              to{' '}
              <strong className="text-ink">
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                  table.getFilteredRowModel().rows.length,
                )}
              </strong>{' '}
              of <strong className="text-ink">{table.getFilteredRowModel().rows.length}</strong> entries
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span>Rows per page:</span>
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
                className="rounded border border-line bg-surface px-1.5 py-0.5 text-xs text-ink"
              >
                {[10, 20, 30, 50].map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    {pageSize}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="flex h-7 w-7 items-center justify-center rounded border border-line bg-surface text-ink-soft hover:text-ink disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2 text-ink-soft">
                {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}
              </span>
              <button
                type="button"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="flex h-7 w-7 items-center justify-center rounded border border-line bg-surface text-ink-soft hover:text-ink disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
