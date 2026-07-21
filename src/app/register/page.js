"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input, notify } from "@/components/ui/index.js";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const validate = () => {
        const next = {};
        if (!email) next.email = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Enter a valid email";
        if (!password) next.password = "Password is required";
        else if (password.length < 6) next.password = "Must be at least 6 characters";
        return next;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const next = validate();
        setErrors(next);
        if (Object.keys(next).length > 0) return;

        setSubmitting(true);
        try {
            const res = await fetch(`${BACKEND}/api/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });
            const data = await res.json();

            if (!res.ok) {
                notify(data.error || "Registration failed", "error");
                setSubmitting(false);
                return;
            }

            // Account created — sign the user straight in via credentials.
            const login = await signIn("credentials", { email, password, redirect: false });
            if (login?.error) {
                notify("Account created — please sign in", "success");
                router.push("/login");
                return;
            }
            notify("Account created — welcome to EchoLodge!", "success");
            router.push("/reviews");
        } catch {
            notify("Something went wrong. Is the backend running?", "error");
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-md mx-auto px-4 py-24">
            <div className="text-center mb-8">
                <p className="text-sm font-medium uppercase tracking-wider text-clay">Join EchoLodge</p>
                <h1 className="mt-2 font-display text-4xl font-semibold text-ink dark:text-parchment">Create your account</h1>
                <p className="mt-3 text-ink-soft dark:text-parchment/70">
                    Set up access to manage your homestay reviews.
                </p>
            </div>

            <form
                onSubmit={handleSubmit}
                noValidate
                className="rounded-3xl bg-surface dark:bg-bark-soft border border-sand dark:border-bark-soft shadow-sm p-8 space-y-5"
            >
                <Input
                    label="Name"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <Input
                    label="Email"
                    type="email"
                    placeholder="host@echolodge.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={errors.email}
                />
                <Input
                    label="Password"
                    type="password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={errors.password}
                />
                <Button type="submit" size="lg" disabled={submitting} className="w-full">
                    {submitting ? "Creating account…" : "Create account"}
                </Button>

                <div className="flex items-center gap-3 py-1">
                    <span className="h-px flex-grow bg-sand dark:bg-bark" />
                    <span className="text-xs uppercase tracking-wider text-ink-soft dark:text-parchment/50">or</span>
                    <span className="h-px flex-grow bg-sand dark:bg-bark" />
                </div>

                <button
                    type="button"
                    onClick={() => signIn("google", { callbackUrl: "/reviews" })}
                    className="w-full inline-flex justify-center items-center gap-3 px-5 py-3 rounded-full border border-sand dark:border-bark-soft bg-surface dark:bg-bark text-ink dark:text-parchment font-medium hover:bg-sand/50 dark:hover:bg-bark-soft transition-colors focus:outline-none focus:ring-2 focus:ring-forest/40"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
                        <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
                    </svg>
                    Continue with Google
                </button>

                <p className="text-center text-sm text-ink-soft dark:text-parchment/70">
                    Already have an account?{" "}
                    <Link href="/login" className="text-forest dark:text-moss font-medium hover:underline">
                        Sign in
                    </Link>
                </p>
            </form>
        </div>
    );
}
