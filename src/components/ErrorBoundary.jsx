"use client";
import { Component } from "react";
import { Button } from "@/components/ui/index.js";

/**
 * Catches unexpected render errors anywhere below it so the app degrades to a
 * friendly recovery screen instead of a blank white page. Class component by
 * necessity — error boundaries have no hook equivalent.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Surface the real error for debugging; the user sees the friendly UI.
    console.error("EchoLodge render error:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-xl mx-auto px-4 py-28 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-clay/10 text-clay">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M12 9v4m0 4h.01M10.29 3.86l-8.2 14.14A1.5 1.5 0 003.39 20.5h17.22a1.5 1.5 0 001.3-2.5l-8.2-14.14a1.5 1.5 0 00-2.6 0z"
              />
            </svg>
          </div>
          <h1 className="mt-6 font-display text-3xl font-semibold text-ink dark:text-parchment">
            Something drifted off course
          </h1>
          <p className="mt-3 text-ink-soft dark:text-parchment/70 leading-relaxed">
            An unexpected error interrupted this page. Your data is safe — try
            again, or head back to the river.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button onClick={this.handleReset}>Try again</Button>
            <Button href="/" variant="outline" onClick={this.handleReset}>
              Back to home
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
