import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { feesService, UpdateFeesDto, FeesResponse } from '@/services/api/fees.service';
import { revenueService } from '@/services/api/revenue.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/ui/use-toast';
import { HiOutlineArrowPath, HiChevronLeft, HiChevronRight } from 'react-icons/hi2';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/dateUtils';

const feesSchema = z.object({
    depositFeePercent: z.coerce.number().min(0, 'Must be at least 0').max(100, 'Must be at most 100'),
    withdrawalFeePercent: z.coerce.number().min(0, 'Must be at least 0').max(100, 'Must be at most 100'),
    onRampFeePercent: z.coerce.number().min(0, 'Must be at least 0').max(100, 'Must be at most 100'),
    offRampFeePercent: z.coerce.number().min(0, 'Must be at least 0').max(100, 'Must be at most 100'),
});

type FeesFormValues = z.infer<typeof feesSchema>;

export default function AdminFeesPage() {
    const queryClient = useQueryClient();

    const { data: fees, isLoading: feesLoading } = useQuery({
        queryKey: ['system-fees'],
        queryFn: feesService.getFees,
    });

    const { data: revenueBalances, isLoading: revenueLoading } = useQuery({
        queryKey: ['system-revenue'],
        queryFn: revenueService.getBalances,
    });

    const [page, setPage] = React.useState(1);
    const { data: paginatedLogs, isLoading: logsLoading } = useQuery({
        queryKey: ['system-revenue-logs', page],
        queryFn: () => revenueService.getLogs({ page, limit: 10 }),
    });

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isDirty },
    } = useForm<FeesFormValues>({
        resolver: zodResolver(feesSchema),
        defaultValues: {
            depositFeePercent: 0,
            withdrawalFeePercent: 0,
            onRampFeePercent: 0,
            offRampFeePercent: 0,
        },
    });

    // Update form defaults when data is loaded
    React.useEffect(() => {
        if (fees) {
            reset(fees);
        }
    }, [fees, reset]);

    const mutation = useMutation({
        mutationFn: (data: UpdateFeesDto) => feesService.updateFees(data),
        onSuccess: (updatedFees: FeesResponse) => {
            queryClient.setQueryData(['system-fees'], updatedFees);
            toast({
                title: 'Success',
                description: 'System fees updated successfully',
            });
            // Reset the form with the new data to clear the dirty state
            reset(updatedFees);
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to update system fees',
                variant: 'destructive',
            });
        },
    });

    const onSubmit = (data: FeesFormValues) => {
        mutation.mutate(data);
    };

    if (feesLoading || revenueLoading || logsLoading) {
        return (
            <div className="flex h-full items-center justify-center p-8">
                <HiOutlineArrowPath className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">System Fees</h3>
                <p className="text-sm text-muted-foreground">
                    Configure the global percentage fees applied across the platform.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Fee Percentages</CardTitle>
                    <CardDescription>
                        These values represent the percentage deducted during user transactions. E.g., setting 1.5 will deduct 1.5% from the transaction amount.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            <div className="space-y-2">
                                <Label htmlFor="depositFeePercent">Deposit Fee (%)</Label>
                                <Input
                                    id="depositFeePercent"
                                    type="number"
                                    step="0.01"
                                    {...register('depositFeePercent')}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Applied to all fiat and crypto deposits.
                                </p>
                                {errors.depositFeePercent && (
                                    <p className="text-sm text-destructive">{errors.depositFeePercent.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="withdrawalFeePercent">Withdrawal Fee (%)</Label>
                                <Input
                                    id="withdrawalFeePercent"
                                    type="number"
                                    step="0.01"
                                    {...register('withdrawalFeePercent')}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Applied to all fiat and crypto withdrawals.
                                </p>
                                {errors.withdrawalFeePercent && (
                                    <p className="text-sm text-destructive">{errors.withdrawalFeePercent.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="onRampFeePercent">On-Ramp Swap Fee (%)</Label>
                                <Input
                                    id="onRampFeePercent"
                                    type="number"
                                    step="0.01"
                                    {...register('onRampFeePercent')}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Applied when swapping Fiat to Crypto.
                                </p>
                                {errors.onRampFeePercent && (
                                    <p className="text-sm text-destructive">{errors.onRampFeePercent.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="offRampFeePercent">Off-Ramp Swap Fee (%)</Label>
                                <Input
                                    id="offRampFeePercent"
                                    type="number"
                                    step="0.01"
                                    {...register('offRampFeePercent')}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Applied when swapping Crypto to Fiat.
                                </p>
                                {errors.offRampFeePercent && (
                                    <p className="text-sm text-destructive">{errors.offRampFeePercent.message}</p>
                                )}
                            </div>

                        </div>

                        <Button type="submit" disabled={mutation.isPending || !isDirty}>
                            {mutation.isPending ? (
                                <>
                                    <HiOutlineArrowPath className="mr-2 h-4 w-4 animate-spin" />
                                    Saving Changes
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Collected Revenue Sub-Accounts</CardTitle>
                    <CardDescription>
                        This displays the aggregate of all fees collected by the platform for each currency.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!revenueBalances || revenueBalances.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground">
                            No revenue has been collected yet.
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Currency</th>
                                        <th className="px-4 py-3 font-medium text-right">Collected Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {revenueBalances.map((balance) => (
                                        <tr key={balance.id}>
                                            <td className="px-4 py-3 font-medium">{balance.currency}</td>
                                            <td className="px-4 py-3 text-right">{balance.balance}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>System Revenue Audit Logs</CardTitle>
                    <CardDescription>
                        A historical audit trail of all fees collected by the system.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!paginatedLogs || paginatedLogs.results.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground">
                            No revenue log available.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="rounded-md border">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted text-muted-foreground">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">Date</th>
                                            <th className="px-4 py-3 font-medium">Type</th>
                                            <th className="px-4 py-3 font-medium text-right">Amount</th>
                                            <th className="px-4 py-3 font-medium text-right">Currency</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {paginatedLogs.results.map((log) => (
                                            <tr key={log.id}>
                                                <td className="px-4 py-3 font-medium">{formatDateTime(log.createdOn)}</td>
                                                <td className="px-4 py-3">
                                                    <Badge variant="outline" className="capitalize">
                                                        {log.type.replace('_', ' ')}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-right">{log.amount}</td>
                                                <td className="px-4 py-3 text-right">{log.systemWallet?.currency || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {paginatedLogs.totalPages > 1 && (
                                <div className="flex items-center justify-end space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                    >
                                        <HiChevronLeft className="h-4 w-4" />
                                        Previous
                                    </Button>
                                    <div className="text-sm font-medium">
                                        Page {page} of {paginatedLogs.totalPages}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage((p) => Math.min(paginatedLogs.totalPages, p + 1))}
                                        disabled={page === paginatedLogs.totalPages}
                                    >
                                        Next
                                        <HiChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
