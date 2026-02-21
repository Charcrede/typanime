import fs from "fs";
import { CITATIONS } from "./src/app/mockOtaku.ts"; // adapte le chemin

fs.writeFileSync(
  "citations.json",
  JSON.stringify(CITATIONS, null, 2),
  "utf-8"
);
