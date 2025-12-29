export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "No text provided" });
  }

  // Simple mock scoring (server-side)
  let score = 80;
  const lower = text.toLowerCase();

  const panicWords = [
    "breaking",
    "share urgently",
    "forward",
    "whatsapp",
    "withdraw cash",
    "internet shutdown",
    "secret operation",
    "government hiding"
  ];

  panicWords.forEach(word => {
    if (lower.includes(word)) score -= 8;
  });

  score = Math.max(0, Math.min(100, score));

  res.status(200).json({
    score,
    message: "Fast credibility check (server-side)"
  });
}
