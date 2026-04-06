const BASE_URL = "http://localhost:5000/api/quotes";

// GET - toate citatele cu filtrare opțională [cite: 1029, 1030]
export async function getAllQuotes(search = "") {
  const url = search.trim()
    ? `${BASE_URL}?search=${encodeURIComponent(search.trim())}`
    : BASE_URL; // [cite: 1031, 1032]
  const response = await fetch(url); // [cite: 1033]
  if (!response.ok) throw new Error("Nu s-au putut prelua citatele."); // [cite: 1034]
  return response.json(); // [cite: 1034]
}

// POST - adaugă citat [cite: 118]
export async function addQuote(quoteData) {
  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(quoteData),
  }); // [cite: 123, 124, 125]

  if (!response.ok) {
    const err = await response.json(); // [cite: 127, 128]
    throw new Error(err.errors?.join(", ") || "Nu s-a putut adăuga citatul."); // [cite: 130]
  }
  return response.json(); // [cite: 133]
}

// POST /api/quotes/fetch-image
export async function fetchAuthorImage(author) {
  const response = await fetch(`${BASE_URL.replace("/quotes", "")}/quotes/fetch-image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ author }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Nu s-a putut prelua imaginea.");
  }
  return response.json(); // { imageUrl: "/images/..." }
}

export async function updateQuote(id, quoteData) {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(quoteData),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.errors?.join(", ") || "Nu s-a putut actualiza citatul.");
  }
  return response.json();
}

// DELETE - șterge citat [cite: 152, 155]
export async function deleteQuote(id) {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
  }); // [cite: 158]

  if (!response.ok) throw new Error("Nu s-a putut șterge citatul."); // [cite: 159]
}