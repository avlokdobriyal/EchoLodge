export default function Footer() {
    return (
        <footer className="bg-gray-50 border-t border-gray-100 py-8 text-center">
            <p className="text-gray-500 text-sm">
                &copy; {new Date().getFullYear()} EchoLodge. All rights reserved.
            </p>
        </footer>
    );
}