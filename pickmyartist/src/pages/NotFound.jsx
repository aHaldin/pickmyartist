import { Link } from "react-router-dom";
import SEO from "../components/SEO.jsx";

export default function NotFound() {
  return (
    <>
      <SEO
        title="PickMyArtist - Page not found"
        description="We couldn't find that page. Browse performers or head back home."
      />
      <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-4 px-6 py-20 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-white/60">404</p>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">
          That page is offstage.
        </h1>
        <p className="max-w-md text-sm text-white/70">
          The route you requested does not exist yet. Head back to the directory.
        </p>
        <Link
          to="/artists"
          className="mt-2 inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-3 text-xs uppercase tracking-[0.3em] text-white transition hover:border-white hover:bg-white hover:text-neutral-900"
        >
          Browse artists
        </Link>
      </section>
    </>
  );
}
