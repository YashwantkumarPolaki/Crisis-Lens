const articles = data.articles || [];

const uniqueSources = new Set(
  articles.map(a => a.source?.name).filter(Boolean)
);

let score = 0;
let status = "";
let breakdown = {};

if (articles.length === 0) {
  score = 20;
  status = "Likely Fake";
} else if (articles.length <= 2) {
  score = 45;
  status = "Use Caution";
} else if (articles.length <= 5) {
  score = 75;
  status = "Likely True";
} else {
  score = 90;
  status = "Highly Credible";
}

breakdown = {
  sourceReliability: Math.min(uniqueSources.size * 20, 100),
  consistency: Math.min(articles.length * 15, 100),
  verification: articles.length > 0 ? 80 : 20
};

return res.status(200).json({
  success: true,
  score,
  status,
  articleCount: articles.length,
  sources: Array.from(uniqueSources),
  breakdown,
  articles: articles.slice(0, 5)
});
