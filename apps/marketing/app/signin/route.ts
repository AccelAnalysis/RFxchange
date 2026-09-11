import type { NextRequest } from "next/server";
import { handoffToExchange } from "../../handoff";
export function GET(request: NextRequest) { return handoffToExchange(request, "signin"); }
