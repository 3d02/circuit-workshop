// Builds artifact/index.html: the same page as dist/index.html, without the
// document wrapper (the artifact host adds its own <!doctype>, <head> and <body>).
// Publish it with dist/style.css and dist/js/** alongside, at the same relative paths.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const html = readFileSync(new URL("../dist/index.html", import.meta.url), "utf8");
const head = html.match(/<head>([\s\S]*?)<\/head>/)[1];
const body = html.match(/<body>([\s\S]*?)<\/body>/)[1];
const keep = head
  .split("\n")
  .map((line) => line.trim())
  .filter((line) => /^<title>|fonts\.g|rel="stylesheet"|<script/.test(line))
  .map((line) => line.replace('href="./', 'href="').replace('src="./', 'src="'));
mkdirSync(new URL("../artifact/", import.meta.url), { recursive: true });
writeFileSync(new URL("../artifact/index.html", import.meta.url), `${keep.join("\n")}\n${body.trim()}\n`);
console.log("wrote artifact/index.html");
