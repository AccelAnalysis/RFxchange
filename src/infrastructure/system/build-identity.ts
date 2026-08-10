const FULL_GIT_SHA = /^[0-9a-f]{40}$/i;

export interface BuildIdentity {
  readonly commitSha: string;
  readonly shortSha: string;
}

export function resolveBuildIdentity(rawCommitSha: string | null | undefined): BuildIdentity | null {
  const commitSha = rawCommitSha?.trim().toLowerCase() ?? "";
  if (!FULL_GIT_SHA.test(commitSha)) return null;

  return Object.freeze({
    commitSha,
    shortSha: commitSha.slice(0, 12),
  });
}

export function currentBuildIdentity(): BuildIdentity | null {
  return resolveBuildIdentity(process.env.RFXCHANGE_BUILD_SHA);
}
