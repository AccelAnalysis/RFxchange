import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/components/map/ExchangeSpatialScene.tsx"],
    rules: {
      // This long-lived Mapbox runtime mirrors current React inputs into refs so native map
      // callbacks always read the latest scene without recreating the map instance.
      "react-hooks/refs": "off",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "functions/lib/**", "next-env.d.ts"]),
]);
