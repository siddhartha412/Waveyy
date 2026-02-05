import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export default function Loading() {
    return (
        <main className="px-6 md:px-20 lg:px-32 py-5">
            <Skeleton className="md:h-[200px] md:w-[200px] rounded-2xl w-full h-[400px]" />
            <Skeleton className="h-4 mt-4 w-32" />
            <Skeleton className="h-3 mt-3 mb-1.5 w-40" />
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-6 mt-2 mb-8 w-20" />
            <ScrollArea className="rounded-md mt-4">
                <div className="flex gap-6">
                    <div className="grid gap-2">
                        <Skeleton className="h-[200px] w-[200px]" />
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-20 -mt-1" />
                    </div>
                    {/* Repeated skeletons roughly matching original */}
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="grid gap-2">
                            <Skeleton className="h-[200px] w-[200px]" />
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-3 w-20 -mt-1" />
                        </div>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" className="hidden sm:flex" />
            </ScrollArea>
        </main>
    )
}
