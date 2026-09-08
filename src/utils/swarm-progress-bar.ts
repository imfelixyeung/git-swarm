import chunk from "lodash.chunk";
import type { GitRepository } from "@/git/discover";
import { ansi } from "./ansi";
import { c } from "./colour";

const countNewlines = (str: string): number => {
    return (str.match(/\n/g) || []).length;
};

export type RepoStatus = "pending" | "started" | "done" | "error";
const repoStatusLabels: Record<RepoStatus, string> = {
    pending: " ",
    started: ".",
    done: c.green("✓"),
    error: c.red("⚠"),
};

export class SwarmProgressBar {
    private width: number;
    private repos: GitRepository[];
    private repoStatus: Map<GitRepository, RepoStatus>;
    private isFirstRender = true;

    constructor(repos: GitRepository[]) {
        this.repos = repos;
        this.width = Math.max(1, (process.stdout.columns || 80) - 2);
        this.repoStatus = new Map();
        repos.forEach((r) => {
            this.repoStatus.set(r, "pending");
        });
    }

    start(): void {
        ansi.hideCursor();
        this.render();
    }

    update(repo: GitRepository, status: RepoStatus): void {
        this.repoStatus.set(repo, status);
        this.render();
    }

    private buildRepoStatusString(repo: GitRepository): string {
        const status = this.repoStatus.get(repo);
        return status ? repoStatusLabels[status] : " ";
    }

    private buildProgress(): string {
        const chunks = chunk(this.repos, this.width);
        const lines = chunks.map((repos) => {
            return repos.map((r) => this.buildRepoStatusString(r)).join("");
        });

        return `${lines.map((l) => `[${l}]`).join("\n")}\n`;
    }

    private render(): void {
        const progress = this.buildProgress();
        if (!this.isFirstRender) {
            ansi.moveUp(countNewlines(progress));
            ansi.carriageReturn();
        } else {
            this.isFirstRender = false;
        }
        process.stdout.write(progress);
    }

    stop(): void {
        const progress = this.buildProgress();
        ansi.moveUp(countNewlines(progress));
        ansi.carriageReturn();
        ansi.clearBelow();
        ansi.showCursor();
        this.isFirstRender = true;
    }

    log(message: string, level: "log" = "log") {
        this.stop();
        console[level](message);
        this.start();
    }
}
