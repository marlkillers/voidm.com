# voidm.com

Minimalist personal homepage — [voidm.com](https://voidm.com)

## Features

- Zero dependencies — pure HTML/CSS/JS
- Auto dark/light theme
- Interactive canvas background
- Chiptune BGM (Web Audio API)
- GitHub repos auto-fetch
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

## Deploy

```sh
npx wrangler pages deploy public --branch main --project-name voidm-com
```

## License

MIT
