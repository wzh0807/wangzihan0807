# AGENTS.md

Gitee course repo for 《高级网页设计》: several students' **independent** static sites plus one larger vanilla-JS app. Root has no build, test, lint, or package manager — plain HTML/CSS/vanilla JS. Do not introduce frameworks, bundlers, or CDNs unless asked. `README.md` is the default Gitee template; ignore it. `.opencode/` is OpenCode tooling (its own ignored `package.json`/`node_modules`), not part of any site.

## Layout / entrypoints

Each top-level directory is a standalone site; most pages inline their CSS and share no assets. Always use full paths.

| Path | Owner / entry |
| --- | --- |
| root `index.html`, `gaojiwanyesheji.html`, `html*.html`, `ziwojiashao.html` | 陈禹燃 practice pages; most inline CSS, some link `basic.css`/`html_basic.css` |
| root `self-intro.html` | 李汶静 standalone intro; not 陈禹燃, not linked from the root index |
| root `img/` | only `头像.jpg`, used by `html_self.html` |
| `1/index.html` | 王子涵 practice index/TOC linking pages under `1/` |
| `1/项目/` | WordTrip单词背诵 app — **untracked in parent repo**, own nested `.git` (branch `master`, no remote) |
| `1/catch-ball.html` | 抓小球 game (`catch-ball.css/js`); `1/spec.md` is its spec |
| `1/l1/` | level exercises (`starter-level*-0807wzh.html`, `data.js`) |
| `24001011029赵雨欣/index.html` | 赵雨欣 (`zwjs.html`, `zyx.html` live here, not repo root); pages self-contained, `basic.css` is empty |
| `wangyao-information/index.html` | 王垚; no `basic.css`, uses `html_basic.css` / `*004.css` |
| `2002120309曹炳宇/web-c/高级网页设计/` | 曹炳宇 |

## Critical gotchas

- `2002120309曹炳宇/.../Git/` is a ~405 MB **vendored Git for Windows install** (whole student dir ~494 MB), all tracked. Never edit, scan, or delete it.
- Never run `git add .` at the repo root. The Gitee commit skills tell you to; don't. Stage explicit paths instead — otherwise you can stage the nested WordTrip repo and unrelated work.
- `1/项目/` is a nested repo with its own history and **no remote**; it is untracked by the parent. Never stage it into the parent; changes there belong to its own repo (run git with `-C 1/项目` or from inside it), and its commits never enter parent history.
- Many active files under `1/` are intentionally untracked (e.g. `catch-ball.*`, `l1/`, `spec.md`, `.trae/`, `项目/`). Don't assume `git status` noise is yours, and never delete or commit them without asking.
- Root `node.exe`, `npm*`, `npx*`, `corepack*`, `node-v24.*.msi`, `install_tools.bat`, `nodevars.bat` are checked-in binaries, not a build setup. There is no root `package.json`; `.opencode/package.json` and `node_modules/` exist locally but are ignored.
- Secrets: `.git/config`'s `origin` URL embeds a Gitee token, and some `.opencode/skills/*/SKILL.md` files contain plaintext Gitee tokens. Never print, copy, paste into chat, or commit them.
- Files are UTF-8 **without BOM** with Chinese text. `.opencode/skills/*` uses CRLF — preserve it.
- Do not commit or push unless asked. `origin/HEAD -> master`; `origin/main` also exists.
- Pre-existing broken refs, not caused by your changes: root `html.html` links missing `./html-work.css`; root `html.html` / `gaojiwanyesheji.html` / `html_basic001.html` link missing `./img/1.jpg`; `24001011029赵雨欣/*.html` link missing `myphoto.jpg`.

## Running / verification

- No automated tests. Verify changes by opening the page in a browser.
- Most pages work via `file://`.
- `1/项目` (WordTrip) fetches `data/*.json`, so `file://` fails. From `1/项目`: `python -m http.server 8080`, then open `http://localhost:8080`.
- WordTrip conventions (from `1/项目/README.md`, the authoritative app doc — unlike the root README): BEM-ish `wzh_` prefix, global `window.WZH` (`js/common.js:776`), CSS layer order `base -> layout -> components -> pages`, `js/common.js` auto-inits on load. `data/*.json` are `{code,message,data}` envelopes; `apiGet` unwraps `.data` (`js/common.js:145`). Its commits use Conventional Commits (`feat:` / `fix:` / `style:` / `chore:`).
- `1/spec.md` is the 抓小球 spec (names `index.html`/`style.css`/`script.js`, but actual files are `catch-ball.html/css/js`). Keep it in sync when changing the game.

## Existing instruction sources

- `1/.trae/rules/superpowers.md` defines the course workflow: brainstorm -> write `spec.md` -> task plan -> manual acceptance checklist -> code -> code review -> browser verification -> git -> `retrospective.md`. Honor it for new features under `1/`; confirm the spec before coding.
- `.opencode/skills/webdesign/SKILL.md` is **stale**: it references `D:\gaojiwangye`, root `zwjs.html`/`zyx.html` (now under `24001011029赵雨欣/`), and a missing `myphoto.jpg`. Don't trust its paths.
- The Gitee commit skills duplicate each other and embed credentials; use only their remote/branch facts and stage explicit paths.
