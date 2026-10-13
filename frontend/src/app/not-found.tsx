import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center p-6">
      <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">404 - Page Not Found</h1>
      <p className="mt-3 text-base text-slate-600 max-w-md">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
