import { useState, useMemo } from 'react'
import type { ReactNode } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineArrowDownTray,
  HiOutlineArrowPath,
  HiOutlineMagnifyingGlass,
  HiOutlineArrowUp,
  HiOutlineArrowDown,
  HiOutlineFunnel,
} from 'react-icons/hi2'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/misc/EmptyState'
import Loader from '@/components/misc/Loader'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

export interface Column<T> {
  id: string
  header: string
  accessorKey?: keyof T
  cell?: (row: T) => ReactNode
  sortable?: boolean
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  searchable?: boolean
  searchPlaceholder?: string
  pagination?: boolean
  pageSize?: number
  onRowClick?: (row: T) => void
  exportable?: boolean
  exportFilename?: string
  className?: string
  // Server-side pagination props
  serverSidePagination?: boolean
  totalItems?: number
  currentPage?: number
  onPageChange?: (page: number) => void
  // Loading props
  isLoading?: boolean // Show blur overlay during pagination/data fetching
  // Refresh props
  refreshable?: boolean
  onRefresh?: () => void
  isRefreshing?: boolean
  // Empty state props
  emptyStateTitle?: string
  emptyStateDescription?: string
  onClearFilters?: () => void
  hasFilters?: boolean
  // Selection props
  selectable?: boolean
  selectedRows?: T[]
  onSelectionChange?: (rows: T[]) => void
  // Export props
  onExport?: (selectedRows: T[], format: 'csv' | 'json') => void
  getRowId?: (row: T) => string
  // Page size props
  onPageSizeChange?: (pageSize: number) => void
  // Filter props
  filterContent?: ReactNode
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchable = false,
  searchPlaceholder = 'Search...',
  pagination = true,
  pageSize = 10,
  onRowClick,
  exportable = false,
  exportFilename = 'export',
  className,
  serverSidePagination = false,
  totalItems,
  currentPage: externalCurrentPage,
  onPageChange,
  isLoading = false,
  refreshable = false,
  onRefresh,
  isRefreshing = false,
  emptyStateTitle,
  emptyStateDescription,
  onClearFilters,
  hasFilters = false,
  selectable = false,
  selectedRows: externalSelectedRows,
  onSelectionChange,
  onExport,
  getRowId = (row: T) => (row as any).id || String(row),
  onPageSizeChange,
  filterContent,
}: DataTableProps<T>) {
  const [filterDialogOpen, setFilterDialogOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [internalCurrentPage, setInternalCurrentPage] = useState(1)
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: 'asc' | 'desc'
  } | null>(null)
  const [internalSelectedRows, setInternalSelectedRows] = useState<T[]>([])

  // Use external selectedRows if provided, otherwise use internal state
  const selectedRows = externalSelectedRows !== undefined ? externalSelectedRows : internalSelectedRows
  const setSelectedRows = onSelectionChange || setInternalSelectedRows

  // Use external currentPage for server-side, internal for client-side
  const currentPage = serverSidePagination && externalCurrentPage !== undefined
    ? externalCurrentPage
    : internalCurrentPage

  const filteredData = useMemo(() => {
    let result = [...data]

    if (search) {
      result = result.filter((row) =>
        columns.some((col) => {
          const value = col.accessorKey ? row[col.accessorKey] : ''
          return String(value).toLowerCase().includes(search.toLowerCase())
        })
      )
    }

    if (sortConfig) {
      result.sort((a, b) => {
        const col = columns.find((c) => c.id === sortConfig.key)
        if (!col || !col.accessorKey) return 0

        const aVal = a[col.accessorKey]
        const bVal = b[col.accessorKey]

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return result
  }, [data, search, sortConfig, columns])

  const paginatedData = useMemo(() => {
    if (!pagination) return filteredData
    // For server-side pagination, data is already paginated, just return it
    if (serverSidePagination) return filteredData
    // For client-side pagination, slice the data
    const start = (currentPage - 1) * pageSize
    return filteredData.slice(start, start + pageSize)
  }, [filteredData, currentPage, pageSize, pagination, serverSidePagination])

  // Calculate total pages based on server-side or client-side pagination
  const totalPages = useMemo(() => {
    if (!pagination) return 1
    if (serverSidePagination && totalItems !== undefined) {
      if (totalItems === 0) return 0
      if (pageSize === 0) return 1
      return Math.ceil(totalItems / pageSize) || 1
    }
    if (filteredData.length === 0) return 0
    if (pageSize === 0) return 1
    return Math.ceil(filteredData.length / pageSize) || 1
  }, [pagination, serverSidePagination, totalItems, pageSize, filteredData.length])

  // Calculate total items for display
  // If server-side pagination: use totalItems if > 0, otherwise use data length as fallback
  // This handles cases where API returns total: 0 but items exist
  const totalItemsForDisplay = serverSidePagination && totalItems !== undefined
    ? (totalItems > 0 ? totalItems : filteredData.length)
    : filteredData.length

  const handleSort = (columnId: string) => {
    const col = columns.find((c) => c.id === columnId)
    if (!col?.sortable) return

    setSortConfig((prev) => {
      if (prev?.key === columnId) {
        return prev.direction === 'asc'
          ? { key: columnId, direction: 'desc' }
          : null
      }
      return { key: columnId, direction: 'asc' }
    })
  }

  // Handle row selection
  const handleRowSelect = (row: T, checked: boolean) => {
    if (checked) {
      setSelectedRows([...selectedRows, row])
    } else {
      setSelectedRows(selectedRows.filter((r) => getRowId(r) !== getRowId(row)))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows([...paginatedData])
    } else {
      const paginatedIds = new Set(paginatedData.map((r) => getRowId(r)))
      setSelectedRows(selectedRows.filter((r) => !paginatedIds.has(getRowId(r))))
    }
  }

  const isRowSelected = (row: T) => {
    return selectedRows.some((r) => getRowId(r) === getRowId(row))
  }

  const isAllSelected = paginatedData.length > 0 && paginatedData.every((row) => isRowSelected(row))

  // Handle export
  const handleExport = (format: 'csv' | 'json') => {
    if (onExport) {
      onExport(selectedRows, format)
    } else {
      // Fallback to default CSV export
      const headers = columns.map((col) => col.header).join(',')
      const rows = selectedRows.length > 0 ? selectedRows : filteredData
      const csvRows = rows.map((row) =>
        columns
          .map((col) => {
            const value = col.accessorKey ? row[col.accessorKey] : ''
            return `"${String(value).replace(/"/g, '""')}"`
          })
          .join(',')
      )

      const csv = [headers, ...csvRows].join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${exportFilename}.csv`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className={cn('space-y-4 animate-in fade-in duration-300', className)}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          {filterContent && (
            <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <HiOutlineFunnel className="h-4 w-4 mr-2" />
                  Filters
                  {hasFilters && (
                    <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center bg-primary text-primary-foreground">
                      !
                    </Badge>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Filter Transactions</DialogTitle>
                </DialogHeader>
                <div className="mt-4">
                  {filterContent}
                </div>
              </DialogContent>
            </Dialog>
          )}
          {searchable && (
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          {selectable && selectedRows.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {selectedRows.length} selected
            </span>
          )}
          {exportable && (
            <Button
              onClick={() => handleExport('csv')}
              variant="outline"
              size="sm"
              disabled={selectable && selectedRows.length === 0}
              className="transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <HiOutlineArrowDownTray className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          )}
          {refreshable && (
            <Button
              onClick={onRefresh}
              variant="outline"
              size="sm"
              disabled={isRefreshing}
              className="transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <HiOutlineArrowPath className={cn('h-4 w-4 mr-2 transition-transform duration-200', isRefreshing && 'animate-spin')} />
              Refresh
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border/50 bg-card shadow-sm relative overflow-hidden">
        {(isLoading || isRefreshing) && (
          <div className="absolute inset-0 bg-background/90 backdrop-blur-md z-10 flex items-center justify-center animate-in fade-in duration-300 ease-out">
            <Loader size="sm" text={isRefreshing ? 'Refreshing data...' : 'Loading page...'} />
          </div>
        )}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/50 hover:bg-transparent">
                {selectable && (
                  <TableHead className="w-12">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                )}
                {columns.map((column, idx) => (
                  <TableHead
                    key={column.id}
                    className={cn(
                      'h-12 font-semibold text-sm text-foreground bg-muted/30',
                      column.sortable && 'cursor-pointer hover:bg-muted/50 transition-all duration-200 group',
                      idx === 0 && 'pl-6'
                    )}
                    onClick={() => column.sortable && handleSort(column.id)}
                  >
                    <div className="flex items-center gap-2">
                      <span>{column.header}</span>
                      {column.sortable && (
                        <div className="flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          {sortConfig?.key === column.id ? (
                            sortConfig.direction === 'asc' ? (
                              <HiOutlineArrowUp className="h-3.5 w-3.5 text-primary" />
                            ) : (
                              <HiOutlineArrowDown className="h-3.5 w-3.5 text-primary" />
                            )
                          ) : (
                            <>
                              <HiOutlineArrowUp className="h-3 w-3 text-muted-foreground/50" />
                              <HiOutlineArrowDown className="h-3 w-3 text-muted-foreground/50 -mt-1" />
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={columns.length + (selectable ? 1 : 0)} className="p-0">
                    <EmptyState
                      title={emptyStateTitle || (search ? 'No results found' : 'No data available')}
                      description={
                        emptyStateDescription ||
                        (search
                          ? 'Try adjusting your search terms or filters.'
                          : 'There are no items to display at this time.')
                      }
                      variant={search ? 'search' : 'default'}
                      onRefresh={onRefresh}
                      onClearFilters={onClearFilters}
                      hasFilters={hasFilters || !!search}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row, index) => (
                  <TableRow
                    key={getRowId(row)}
                    className={cn(
                      'border-b border-border/30 transition-all duration-200 ease-out animate-in fade-in slide-in-from-left-2',
                      'hover:bg-muted/40 hover:shadow-sm',
                      onRowClick && 'cursor-pointer active:scale-[0.99]',
                      isRowSelected(row) && 'bg-muted/60',
                      index % 2 === 0 ? 'bg-card' : 'bg-card/50'
                    )}
                    style={{ animationDelay: `${index * 20}ms` }}
                    onClick={() => onRowClick?.(row)}
                  >
                    {selectable && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isRowSelected(row)}
                          onCheckedChange={(checked) => handleRowSelect(row, checked as boolean)}
                          aria-label={`Select row ${getRowId(row)}`}
                        />
                      </TableCell>
                    )}
                    {columns.map((column, colIdx) => {
                      const cellValue = column.cell
                        ? column.cell(row)
                        : column.accessorKey
                          ? String(row[column.accessorKey] ?? '')
                          : ''

                      // Check if this is a reference column and needs truncation
                      const isReferenceColumn = column.id === 'reference' || column.id === 'ref'

                      // Only truncate if it's a reference column and the value is a plain string
                      if (isReferenceColumn && typeof cellValue === 'string' && cellValue.length > 20) {
                        return (
                          <TableCell
                            key={column.id}
                            onClick={(e) => e.stopPropagation()}
                            className={cn(colIdx === 0 && 'pl-6')}
                          >
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="block truncate max-w-[200px] cursor-help font-mono text-sm">
                                    {cellValue}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent className="shadow-lg">
                                  <p className="max-w-xs break-all font-mono text-xs">{cellValue}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                        )
                      }

                      return (
                        <TableCell key={column.id} className={cn(colIdx === 0 && 'pl-6')}>
                          {cellValue}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {pagination && (totalPages > 0 || totalItemsForDisplay > 0) && (
        <div className="flex items-center justify-between gap-4 flex-wrap pt-2">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="text-sm font-medium text-muted-foreground">
              Showing <span className="text-foreground font-semibold">{(currentPage - 1) * pageSize + 1}</span> to{' '}
              <span className="text-foreground font-semibold">{Math.min(currentPage * pageSize, totalItemsForDisplay)}</span> of{' '}
              <span className="text-foreground font-semibold">{totalItemsForDisplay}</span> results
            </div>
            {onPageSizeChange && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Items per page:</span>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => {
                    const newPageSize = parseInt(value)
                    if (onPageSizeChange) {
                      onPageSizeChange(newPageSize)
                    }
                  }}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          {totalPages > 1 ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newPage = Math.max(1, currentPage - 1)
                  if (serverSidePagination && onPageChange) {
                    onPageChange(newPage)
                  } else {
                    setInternalCurrentPage(newPage)
                  }
                }}
                disabled={currentPage === 1}
                className="transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                <HiOutlineChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm font-medium px-3 py-1.5 bg-muted/50 rounded-md min-w-[100px] text-center">
                Page <span className="text-foreground font-semibold">{currentPage}</span> of <span className="text-foreground font-semibold">{totalPages}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newPage = Math.min(totalPages, currentPage + 1)
                  if (serverSidePagination && onPageChange) {
                    onPageChange(newPage)
                  } else {
                    setInternalCurrentPage(newPage)
                  }
                }}
                disabled={currentPage === totalPages}
                className="transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                <HiOutlineChevronRight className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="text-sm font-medium text-muted-foreground">
              Page <span className="text-foreground font-semibold">{currentPage}</span> of <span className="text-foreground font-semibold">{totalPages}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

