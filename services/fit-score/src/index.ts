import express from "express";
import { calculateFitScore } from "./calculate";

const app = express();
app.use(express.json());

const SECRET = process.env.FIT_SCORE_SECRET;

app.post("/calculate", (req, res) => {
  if (SECRET) {
    const auth = req.headers.authorization ?? "";
    if (auth !== `Bearer ${SECRET}`) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
  }
  try {
    const result = calculateFitScore(req.body);
    res.json(result);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Bad request";
    res.status(400).json({ error: message });
  }
});

const PORT = Number(process.env.PORT ?? 8080);
app.listen(PORT, () => {
  console.log(`fit-score service listening on :${PORT}`);
});
