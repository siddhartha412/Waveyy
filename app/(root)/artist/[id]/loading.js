import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="px-6 md:px-20 lg:px-32 py-10 space-y-8">
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-end">
                <Skeleton className="h-[200px] w-[200px] rounded-full" />
                <div className="space-y-4 w-full text-center md:text-left">
                    <Skeleton className="h-12 w-3/4 md:w-1/3 mx-auto md:mx-0" />
                    <Skeleton className="h-4 w-1/2 md:w-1/4 mx-auto md:mx-0" />
                </div>
            </div>
            <div className="space-y-4">
                <Skeleton className="h-8 w-40" />
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-[240px] w-full rounded-md" />
                    ))}
                </div>
            </div>
        </div>
    );
}
