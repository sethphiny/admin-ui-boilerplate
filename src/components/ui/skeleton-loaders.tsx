import { Skeleton } from "@/components/ui/skeleton"

export function TableSkeleton() {
    return (
        <div className="w-full space-y-4">
            {/* Table Header */}
            <div className="flex w-full items-center justify-between space-x-4 border-b pb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-6 w-[150px]" />
                ))}
            </div>

            {/* Table Rows */}
            {Array.from({ length: 5 }).map((_, rowIndex) => (
                <div key={rowIndex} className="flex w-full items-center justify-between space-x-4 py-3">
                    {Array.from({ length: 5 }).map((_, colIndex) => (
                        <Skeleton key={colIndex} className="h-4 w-[120px]" />
                    ))}
                </div>
            ))}
        </div>
    )
}

export function CardSkeleton() {
    return (
        <div className="rounded-xl border bg-card text-card-foreground shadow space-y-4 p-6">
            <Skeleton className="h-5 w-[140px]" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-4 w-[200px]" />
        </div>
    )
}
