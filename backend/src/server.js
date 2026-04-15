import "dotenv/config";
import app from "./app.js";
import { ensureSchema } from "./db/ensureSchema.js";

const PORT = process.env.PORT || 5000;

await ensureSchema();

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
