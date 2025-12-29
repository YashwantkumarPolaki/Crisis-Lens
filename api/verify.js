import natural from "natural";

const TfIdf = natural.TfIdf;

function cosineSimilarity(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (const k in a) {
    dot += (a[k] || 0) * (b[k] || 0);
    na += a[k] * a[k];
  }
  for (const k in b) {
    nb += b[k] * b[k];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

function toVector(tfidf, i) {
  const v = {};
  tfidf.listTerms(i).forEach(t => {
    v[t.term] = t.tfidf;
  });
  return v;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: "No text provided" });
  }

  try {
    const url =
      `https://www.googleapis.com/customsearch/v1` +
      `?q=${encodeURIComponent(text)}` +
      `&key=${process.env.GOOGLE_API_KEY}` +
      `&cx=${process.env.GOOGLE_CX}` +
      `&dateRestrict=d1&sort=date`;

    console.log("KEY:", process.env.GOOGLE_API_KEY?.slice(0, 6));
    console.log("CX:", process.env.GOOGLE_CX);

    const r = await fetch(url);
    const data = await r.json();

    if (!r.ok) {
      return res.status(500).json({
        error: "Google API failed",
        details: data.error?.message
      });
    }

    const items = data.items || [];

    const tfidf = new TfIdf();
    tfidf.addDocument(text);

    items
      .slice(0, 5)
      .filter(i => i.snippet)
      .forEach(i => tfidf.addDocument(i.snippet));

    let sim = 0;
    for (let i = 1; i <= Math.min(5, items.length); i++) {
      sim += cosineSimilarity(
        toVector(tfidf, 0),
        toVector(tfidf, i)
      );
    }

    const similarity = items.length
      ? sim / Math.min(5, items.length)
      : 0;

    const nlpSimilarity = Math.round(similarity * 100);

    // ---------- SCORE ----------
    let score = Math.min(
      nlpSimilarity * 0.7 + items.length * 4,
      100
    );

    if (nlpSimilarity < 20) score -= 40;

    const panicWords = [
      "predicted",
      "tonight",
      "stay awake",
      "scientists warn",
      "massive earthquake",
      "share urgently",
      "breaking"
    ];

    panicWords.forEach(word => {
      if (text.toLowerCase().includes(word)) {
        score -= 8;
      }
    });

    score = Math.max(0, Math.min(100, score));

    // ---------- LABEL ----------
    let label;
    if (nlpSimilarity < 20) {
      label = "Likely False";
    } else if (score >= 70) {
      label = "Likely True";
    } else {
      label = "Needs Verification";
    }

    // ---------- RESPONSE ----------
    res.json({
      score: Math.round(score),
      nlpSimilarity,
      label,
      verifiedAt: new Date().toLocaleString("en-IN"),
      sources: items.slice(0, 5).map(i => ({
        title: i.title,
        link: i.link,
        snippet: i.snippet
      }))
    });

  } catch (err) {
    res.status(500).json({
      error: "Server error",
      details: err.message
    });
  }
}
