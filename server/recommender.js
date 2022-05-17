import { createRequire } from "module";
const require = createRequire(import.meta.url);
import { webGraph } from "./index.js";

export async function createRelations() {
  if (webGraph.order == 0) {
    console.error("empty graph");
    return;
  }
  webGraph.forEachEdge(
    (
      edge,
      attributes,
      source,
      target,
      sourceAttributes,
      targetAttributes,
      udirected
    ) => {}
  );
}
