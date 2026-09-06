import type { RemoteWithRefs } from "simple-git";
import { filterNotNull } from "@/utils/filter-not-null";

export type GitProvider = "github" | "gitlab" | "bitbucket" | "unknown";
export type GitProtocol = "https" | "http" | "ssh" | "file";

export interface ParsedGitUrl {
    ref: string;
    provider: GitProvider;
    protocol: GitProtocol;
    host: string;
    owner: string;
    name: string;
    fullName: string;
    href: string;
}

const KNOWN_PROVIDERS: Record<string, GitProvider> = {
    "github.com": "github",
    "gitlab.com": "gitlab",
    "bitbucket.org": "bitbucket",
};

export function parseGitUrl(ref: string, rawUrl: string): ParsedGitUrl | null {
    if (!rawUrl || typeof rawUrl !== "string") return null;

    // Clean trailing spaces and trailing whitespace/newlines from git remote -v
    const cleaned = rawUrl.trim();

    let protocol: GitProtocol = "https";
    let host = "";
    let path = "";

    // 1. Match SCP-like SSH syntax: git@github.com:owner/repo.git
    const scpMatch = cleaned.match(/^(?:([^@]+)@)?([^:]+):(.+)$/);

    if (scpMatch && !cleaned.includes("://")) {
        protocol = "ssh";
        // biome-ignore lint/style/noNonNullAssertion: regex must match
        host = scpMatch[2]!;
        // biome-ignore lint/style/noNonNullAssertion: regex must match
        path = scpMatch[3]!;
    } else {
        // 2. Standard URI syntax: https://, ssh://, git://
        try {
            // Strip authentication details if present for cleaner parsing
            const urlObj = new URL(cleaned);

            protocol =
                (urlObj.protocol.replace(":", "") as GitProtocol) || "https";
            host = urlObj.hostname;
            path = urlObj.pathname.replace(/^\//, ""); // Strip leading slash
        } catch {
            return null; // Invalid URL structure
        }
    }

    // remote trailing .git
    path = path.replace(/\.git$/, "").replace(/\/$/, "");

    const segments = path.split("/").filter(Boolean);
    if (segments.length < 2) return null;

    // biome-ignore lint/style/noNonNullAssertion: must exist from assertion above
    const name = segments.pop()!;

    // biome-ignore lint/style/noNonNullAssertion: must exist from assertion above
    const owner = segments[0]!;
    const fullName = [...segments, name].join("/");
    const provider = KNOWN_PROVIDERS[host.toLowerCase()] || "unknown";

    return {
        ref,
        provider,
        protocol,
        host,
        owner,
        name,
        fullName,
        href: `https://${host}/${fullName}`,
    };
}

export const parseGitRemoteRefs = (refs: RemoteWithRefs[]) => {
    return filterNotNull(
        refs.map((ref) => parseGitUrl(ref.name, ref.refs.fetch)),
    );
};
