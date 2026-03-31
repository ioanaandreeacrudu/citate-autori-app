import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import QuoteCard from "../components/QuoteCard";;
import { getAllQuotes } from "../api/quotesApi";

export default function QuotesPage() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getAllQuotes()
      .then((data) => setQuotes(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-light">
        <p className="text-brand text-lg font-medium animate-pulse">
          Se încarcă citatele...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-light">
        <p className="text-red-500 text-lg font-medium">⚠ {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-light">
      <header className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand">
              Citate Autori Celebri
            </h1>
            <p className="text-sm text-gray-500">
              {quotes.length} {quotes.length === 1 ? "citat" : "citate"}
            </p>
          </div>

          <Link
            to="/manage"
            className="px-4 py-2 bg-brand text-white text-sm font-medium rounded-lg hover:bg-brand-dark transition-colors duration-200"
          >
            ⚙ Administrează
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {quotes.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-xl mb-4">Nu există citate încă.</p>
            <Link
              to="/manage"
              className="text-brand underline hover:text-brand-dark"
            >
              Adaugă primul citat →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {quotes.map((q) => (
              <QuoteCard key={q.id} quote={q} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}