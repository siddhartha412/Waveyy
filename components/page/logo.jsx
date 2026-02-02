import Link from "next/link";

export default function Logo() {
    return (
        <Link href="/" className="select-none">
            <div>
                <h1 className="text-2xl font-bold">
                    <span className="text-blue-500">Wave</span><span className="text-pink-500">yy</span>
                </h1>
            </div>
        </Link>
    )
}
