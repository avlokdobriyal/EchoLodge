"use client";
import { useState } from "react";
import { Button, Input, notify } from "@/components/ui/index.js";

export default function LoginPage() {
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

    const handleSubmit = (e) => {
        e.preventDefault();
        const next = validate();
        setErrors(next);
        if (Object.keys(next).length > 0) return;

        // Client-only demo — no backend auth wired up.
        setSubmitting(true);
        notify("Signed in (demo) — welcome back!", "success");
        setTimeout(() => setSubmitting(false), 800);
    };

    return (
        <div className="max-w-md mx-auto px-4 py-24">
            <div className="text-center mb-8">
                <p className="text-sm font-medium uppercase tracking-wider text-clay">Staff portal</p>
                <h1 className="mt-2 font-display text-4xl font-semibold text-ink dark:text-parchment">Welcome back</h1>
                <p className="mt-3 text-ink-soft dark:text-parchment/70">
                    Authenticate to manage bookings and reviews.
                </p>
            </div>

            <form
                onSubmit={handleSubmit}
                noValidate
                className="rounded-3xl bg-surface dark:bg-bark-soft border border-sand dark:border-bark-soft shadow-sm p-8 space-y-5"
            >
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
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={errors.password}
                />
                <Button type="submit" size="lg" disabled={submitting} className="w-full">
                    {submitting ? "Signing in…" : "Sign in"}
                </Button>
                <p className="text-center text-xs text-ink-soft dark:text-parchment/50">
                    Demo form — no credentials are sent anywhere.
                </p>
            </form>
        </div>
    );
}
