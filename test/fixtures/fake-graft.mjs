// Stand-in for the graft CLI; no network or real graph mutations.
import { appendFileSync } from "node:fs";
const args = process.argv.slice(2);
appendFileSync(process.env.GRAFT_LOG, args.join(" ") + "\n");
switch (args[0]) {
  case "--version": console.log("graft 0.0.0-test"); break;
  case "check": console.log(JSON.stringify({ graph: { changed: ["src/a.ts"], added: [], removed: [] } })); break;
  case "build": break;
  default: console.log("{}");
}
