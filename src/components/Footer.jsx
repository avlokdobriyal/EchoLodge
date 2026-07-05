import Link from "next/link";

export default function Footer() {
    const year = new Date().getFullYear();
    return (
        <footer className="mt-auto bg-sand/60 dark:bg-bark-soft border-t border-sand dark:border-bark-soft">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <span className="font-display text-xl font-semibold text-forest dark:text-moss">
                            Echo<span className="text-clay">Lodge</span>
                        </span>
                        <p className="mt-3 text-sm text-ink-soft dark:text-parchment/60 max-w-xs leading-relaxed">
                            Community eco-tourism and boutique homestays in Laxman Jhula, Rishikesh. Book direct, stay warm.
                        </p>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-ink dark:text-parchment mb-3">Explore</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/" className="text-ink-soft dark:text-parchment/60 hover:text-forest dark:hover:text-moss transition-colors">Home</Link></li>
                            <li><Link href="/about" className="text-ink-soft dark:text-parchment/60 hover:text-forest dark:hover:text-moss transition-colors">About</Link></li>
                            <li><Link href="/dashboard" className="text-ink-soft dark:text-parchment/60 hover:text-forest dark:hover:text-moss transition-colors">Dashboard</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-ink dark:text-parchment mb-3">Visit</h4>
                        <p className="text-sm text-ink-soft dark:text-parchment/60 leading-relaxed">
                            Laxman Jhula<br />Rishikesh, Uttarakhand<br />India
                        </p>
                    </div>
                </div>
                <div className="mt-10 pt-6 border-t border-sand dark:border-bark text-center text-sm text-ink-soft dark:text-parchment/50">
                    &copy; {year} EchoLodge. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
