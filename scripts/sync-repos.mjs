import { writeFile } from "node:fs/promises";

const USER = "marlkiller";
const TOP = 6;
const OUT = new URL("../public/data/repos.json", import.meta.url);
const token = process.env.GITHUB_TOKEN;

const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": "voidm.com-sync",
};
if (token) headers.Authorization = `Bearer ${token}`;

const res = await fetch(
  `https://api.github.com/users/${USER}/repos?per_page=100&type=public`,
  { headers },
);
if (!res.ok) {
  console.error(`GitHub API ${res.status}: ${await res.text()}`);
  process.exit(1);
}

const repos = (await res.json())
  .filter((r) => !r.fork)
  .sort((a, b) => b.stargazers_count - a.stargazers_count || a.name.localeCompare(b.name))
  .slice(0, TOP)
  .map((r) => ({
    name: r.name,
    html_url: r.html_url,
    description: r.description ? r.description.replace(/\s+/g, " ").trim() : null,
    language: r.language,
    stargazers_count: r.stargazers_count,
    fork: r.fork,
    homepage: r.homepage || "",
    pushed_at: r.pushed_at,
  }));

await writeFile(OUT, JSON.stringify(repos, null, 2) + "\n");
console.log(`wrote ${repos.length} repos -> ${OUT.pathname}`);
repos.forEach((r) => console.log(`  ${r.stargazers_count}\t${r.name}`));
