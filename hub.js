"use strict";

const subjects = document.querySelector("#subjects");
const studios = document.querySelector("#studios");
const status = document.querySelector("#status");
async function readGitHubJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(7000) });
  if (!response.ok) throw new Error(`GitHub request failed (${response.status})`);
  return response.json();
}

async function discoverPublicStudios() {
  const host = location.hostname.match(/^([a-z0-9-]+)\.github\.io$/i);
  if (!host) throw new Error("No catalogue is available on this host.");
  const firstSegment = location.pathname.split("/")[1];
  const repository = firstSegment && firstSegment !== "index.html" ? firstSegment : location.hostname;
  const endpoint = `https://api.github.com/repos/${host[1]}/${encodeURIComponent(decodeURIComponent(repository))}`;
  const { default_branch: branch } = await readGitHubJson(endpoint);
  const { tree, truncated } = await readGitHubJson(`${endpoint}/git/trees/${encodeURIComponent(branch)}?recursive=1`);
  if (!Array.isArray(tree) || truncated) throw new Error("Incomplete repository file listing.");

  return tree.filter(({ path, type, mode }) => {
    const parts = path.split("/");
    return type === "blob" && mode !== "120000" && /\.html$/i.test(path)
      && !parts.some(part => part.startsWith("."))
      && (parts.length === 1 ? !/^(index|404)\.html$/i.test(path) : parts[0] === "studios");
  }).map(({ path }) => {
    const parts = path.split("/");
    const title = parts.at(-1).replace(/\.html$/i, "").replace(/[_-]+/g, " ");
    const subject = parts.length > 2 ? parts[1].replace(/[_-]+/g, " ")
      : title.replace(/^year\s*\d+\s*/i, "").trim().split(/\s+/)[0] || "Other";
    return { title, subject, url: "./" + parts.map(encodeURIComponent).join("/") };
  }).sort((a, b) => a.subject.localeCompare(b.subject) || a.title.localeCompare(b.title));
}

function renderCatalog(catalog) {
  const filters = [null, ...new Set(catalog.map(studio => studio.subject))];

  function showStudios(subject) {
    const matches = subject === null ? catalog : catalog.filter(studio => studio.subject === subject);
    studios.replaceChildren(...matches.map(studio => {
      const row = document.createElement("li");
      const link = document.createElement("a");
      link.href = studio.url;
      for (const [tag, className, content] of [
        ["span", "subject", studio.subject],
        ["strong", "title", studio.title],
        ["span", "open", "Open studio"]
      ]) {
        const label = document.createElement(tag);
        label.className = className;
        label.textContent = content;
        link.append(label);
      }
      row.append(link);
      return row;
    }));
    status.textContent = matches.length
      ? `${matches.length} ${matches.length === 1 ? "studio" : "studios"}`
      : "No studios are available yet.";
  }

  if (filters.length > 1) {
    filters.forEach((subject, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = subject ?? "All subjects";
      button.setAttribute("aria-pressed", String(index === 0));
      button.addEventListener("click", () => {
        for (const filter of subjects.children) {
          filter.setAttribute("aria-pressed", String(filter === button));
        }
        showStudios(subject);
      });
      subjects.append(button);
    });
  }
  showStudios(null);
}

async function start() {
  try {
    renderCatalog(Array.isArray(window.revisionCatalog) ? window.revisionCatalog : await discoverPublicStudios());
  } catch (error) {
    console.warn("Revision catalogue unavailable", error);
    status.textContent = "The studio list is temporarily unavailable. Try refreshing the page.";
  }
}

start();
