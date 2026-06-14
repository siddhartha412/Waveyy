export default function Footer({ sidebarOpen = true }) {
    return (
        <footer
            className={`py-5 backdrop-blur-[40px] mt-8 px-6 md:px-20 lg:px-32 ${
                sidebarOpen ? "lg:pl-[282px]" : "lg:pl-[100px]"
            }`}
        >
            <p className="text-sm text-muted-foreground">Built for educational purpose. Made by <a className="underline text-primary hover:text-primary" href="https://github.com/siddhartha412">siddhartha412</a>.</p>
        </footer>
    )
}
