export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { text } = req.body;
  if (!text || text.length < 10) {
    return res.status(400).json({ error: "Invalid input" });
  }

  try {
    const API_KEY = process.env.GNEWS_API_KEY;
    const query = encodeURIComponent(text.slice(0, 120));

    const url = `https://gnews.io/api/v4/search?q=${query}&lang=en&max=5&apikey=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    let score = 25;
    let sources = [];

    if (data.articles && data.articles.length > 0) {
      score = Math.min(90, 40 + data.articles.length * 10);
      sources = data.articles.map(a => ({
        title: a.title,
        source: a.source.name,
        url: a.url
      }));
    }

    res.status(200).json({
      credibilityScore: score,
      verdict: score >= 60 ? "Likely True" : "Needs Verification",
      matchedArticles: sources
    });

  } catch (err) {
    res.status(500).json({ error: "Fact check failed" });
  }
}
