/** Optional prefill from the public GitHub API (no auth; 60 requests/hour per IP). */
export interface GitHubProfile {
  login: string;
  name: string | null;
  bio: string | null;
  company: string | null;
  location: string | null;
  avatarUrl: string;
  hasCustomAvatar: boolean; // false for identicons → start in the no-photo mode
}

/** The login from what people paste: "@login", "github.com/login/", a full profile URL (query and subpaths ignored), or the login itself. */
export function normalizeLogin(input: string): string {
  const rest = input.trim().replace(/^@/, "").replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/^github\.com\//i, "");
  return rest.split(/[/?#]/)[0].trim();
}

export async function fetchProfile(login: string): Promise<GitHubProfile> {
  const res = await fetch(`https://api.github.com/users/${encodeURIComponent(normalizeLogin(login))}`, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (res.status === 404) throw new Error("GitHub user not found");
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  const u = await res.json();
  return {
    login: u.login,
    name: u.name ?? null,
    bio: u.bio ?? null,
    company: u.company ?? null,
    location: u.location ?? null,
    avatarUrl: u.avatar_url,
    // Identicons are served from the same host; the API does not flag them. Detect later by
    // sampling the image (flat two-colour grid) in the pipeline; assume a photo for now.
    hasCustomAvatar: true,
  };
}
