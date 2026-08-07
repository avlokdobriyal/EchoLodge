import LoadingScreen from "@/components/LoadingScreen";

// App Router picks this up automatically and wraps the route in a Suspense
// boundary, so it covers navigation between pages without any page having to
// know about it.
export default function Loading() {
  return <LoadingScreen label="Loading EchoLodge" />;
}
