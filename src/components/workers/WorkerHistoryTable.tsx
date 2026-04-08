import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { WorkerExecutionHistory } from '@/types/workers/workers'
import { formatDateTime } from '@/lib/dateUtils'

interface WorkerHistoryTableProps {
  history: WorkerExecutionHistory[]
}

export function WorkerHistoryTable({ history }: WorkerHistoryTableProps) {
  const formatExecutionTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`
    return `${(ms / 60000).toFixed(2)}m`
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No execution history available
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Timestamp</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Execution Time</TableHead>
            <TableHead>Error Message</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((entry, index) => (
            <TableRow key={index}>
              <TableCell>{formatDateTime(entry.timestamp)}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={
                    entry.status === 'success'
                      ? 'bg-green-100 text-green-800 border-green-200'
                      : 'bg-red-100 text-red-800 border-red-200'
                  }
                >
                  {entry.status}
                </Badge>
              </TableCell>
              <TableCell>{formatExecutionTime(entry.executionTime)}</TableCell>
              <TableCell className={entry.errorMessage ? 'text-red-600' : 'text-muted-foreground'}>
                {entry.errorMessage || '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
