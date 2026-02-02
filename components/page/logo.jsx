import Link from "next/link";

export default function Logo() {
    return (
        <Link href="/" className="select-none">
            <div>
                <h1 className="text-3xl font-extrabold">
                    <span className="text-white">Wave</span>
                    <span className="text-blue-500">yy</span>
                </h1>
            </div>
        </Link>
    )
}
