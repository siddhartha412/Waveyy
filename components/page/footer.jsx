import Link from "next/link";

export default function Footer({ sidebarOpen = true }) {
    return (
        <footer
            className={`py-5 backdrop-blur-3xl mt-8 px-6 md:px-20 lg:px-32 ${
                sidebarOpen ? "lg:pl-[282px]" : "lg:pl-[98px]"
            }`}
        >
            {/* <div>
                <h1 className="text-xl font-bold">Music<span className="opacity-50">hub</span></h1>
            </div> */}
            <p className="text-sm text-muted-foreground">Built for educational purpose. Made by <a className="underline text-primary hover:text-primary" href="https://github.com/siddhartha412">siddhartha412</a>.</p>
        </footer>
    )
}
