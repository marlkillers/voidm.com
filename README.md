# voidm.com

Minimalist personal homepage — [voidm.com](https://voidm.com)

## Features

- Zero dependencies — pure HTML/CSS/JS
- Auto dark/light theme
- Interactive canvas background
- Chiptune BGM (Web Audio API)
- GitHub top repos from static JSON config
- Articles from JSON config

## Tech

- Vanilla JS, no frameworks
- Canvas API + Web Audio API
- Cloudflare Pages

## Getting Started

```sh
git clone https://github.com/marlkiller/voidm.com.git
cd voidm.com
npx wrangler pages dev public
```

## Sync GitHub repos

Top 6 starred public repos are snapshotted in `public/data/repos.json`, so the
page makes no GitHub API calls. Refresh it with:

```sh
GITHUB_TOKEN=ghp_xxx npm run sync:repos
```

The token is optional (60 req/h unauthenticated) and read from the env only.

## Deploy

```sh
npx wrangler pages deploy public --branch master --project-name voidm-com
```

## License

MIT
