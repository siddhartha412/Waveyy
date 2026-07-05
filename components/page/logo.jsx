import Link from "next/link";

export default function Logo() {
    return (
        <Link href="/" className="select-none">
            <div className="flex items-center">
                <img src="/icon.svg" alt="Waveyy" className="h-12 w-12 mr-4" width={48} height={48} />
                <h1 className="text-2xl font-extrabold">
                    <span className="text-white">Wave</span>
                    <span className="text-blue-500">yy</span>
                </h1>
            </div>
        </Link>
    )
}
