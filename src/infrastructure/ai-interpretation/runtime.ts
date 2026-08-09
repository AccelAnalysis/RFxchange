import type { Firestore } from "firebase-admin/firestore";

import { AiAmacsInterpretationGateway } from "../../application/ai-interpretation/gateway.ts";
import { loadImmutableAmacsCatalog } from "../amacs/runtime.ts";
import { loadAmacsRuntimeSchemaValidator } from "../amacs/runtime-schema-validator.ts";
import { createServerFirebaseAccountSecurityService } from "../auth/firebase-account-security-runtime.ts";
import { createFirestoreFoundationRepositories } from "../firestore/repositories.ts";
import { getServerFirestore } from "../firestore/runtime.ts";
import { FirestoreAiInterpretationRepository } from "../firestore/ai-interpretation-repository.ts";
import { CanonicalInterpretationAuthority } from "./authority.ts";
import { JsonContentSafeInterpretationObserver } from "./observer.ts";
import { OpenAiResponsesInterpretationAdapter } from "./openai-responses-adapter.ts";
import { EnvironmentInterpretationFeaturePolicy } from "./policy.ts";

let singleton: Promise<AiAmacsInterpretationGateway> | null = null;

export function createServerAiAmacsInterpretationGateway(db: Firestore = getServerFirestore()): Promise<AiAmacsInterpretationGateway> {
  if (singleton) return singleton;
  singleton = Promise.all([loadImmutableAmacsCatalog(), loadAmacsRuntimeSchemaValidator()]).then(([catalog, validator]) => {
    const foundation = createFirestoreFoundationRepositories(db);
    const repository = new FirestoreAiInterpretationRepository(db);
    return new AiAmacsInterpretationGateway({
      authority: new CanonicalInterpretationAuthority({ accountSecurity: createServerFirebaseAccountSecurityService(), organizations: foundation.organizations.accounts, memberships: foundation.users.memberships, authorizations: foundation.organizationAuthorization, restrictions: foundation.lifecycle.restrictions }),
      featurePolicy: new EnvironmentInterpretationFeaturePolicy(), provider: new OpenAiResponsesInterpretationAdapter(),
      catalog, validator, repository, quota: repository, observer: new JsonContentSafeInterpretationObserver(),
    });
  }).catch((cause) => { singleton = null; throw cause; });
  return singleton;
}
