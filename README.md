# LinkedIn-ify

An English → LinkedIn-speak translator. Type a plain sentence, get back an
unbearably inspiring LinkedIn post (humblebrags, buzzwords, `#blessed` hashtag walls,
emoji). Flip it around and it decodes a cringey LinkedIn post into blunt honest English.

Runs entirely on **Cloudflare Workers AI** — one Worker serves the UI and does the
inference. Free tier, no API keys to manage, no separate backend.

## Features

- **English → LinkedIn** and **LinkedIn → English** (reverse decoder) modes.
- **Buzzword Intensity** slider: Subtle → Professional → Influencer → Maximum cringe.
- **Exaggeration** slider: Honest → Embellished → Heroic → Saved the company.
- **☢️ Nuclear Mode**: the nuclear option. Overrides the exaggeration slider so the most
  trivial act (fixing a lightswitch) becomes the single most important event in human
  history — averting nuclear war, ending famine, uniting nations.
- **Hashtags** and **Emoji** toggles.
- **Copy** and **Regenerate** (a fresh take on the same input).
- Streams the result token-by-token.

## Run it

Requires Node.js and a free Cloudflare account.

```bash
cd linkedin-translator
npm install
npx wrangler login        # one-time browser login (Workers AI runs on Cloudflare even in dev)
npm run dev               # open the printed http://localhost:8787
```

Deploy it live:

```bash
npm run deploy            # -> https://linkedin-translator.<your-subdomain>.workers.dev
```

## Configuration

The model is set in one place — `wrangler.toml`:

```toml
[vars]
MODEL = "@cf/openai/gpt-oss-120b"
```

Other good Workers AI text models:

| Model | Notes |
|---|---|
| `@cf/openai/gpt-oss-120b` | Default. Highest quality/wit. Reasoning model — handled below. |
| `@cf/meta/llama-4-scout-17b-16e-instruct` | Fast, clean instruct output, no reasoning. Great fallback. |
| `@cf/meta/llama-3.3-70b-instruct-fp8-fast` | Proven, solid. |
| `@cf/qwen/qwen3-30b-a3b-fp8` | Fast & cheap; also has a thinking mode. |

Free tier is ~10,000 Neurons/day, which is plenty for a side project.

**Reasoning models** (gpt-oss, qwen3) think before answering. The Worker handles this for
you: it tells the model `Reasoning: low` and **normalizes the stream**, dropping the
chain-of-thought so only the finished post reaches the page. If a reasoning model ever
feels slow or leaks stray "thinking" text, switch `MODEL` to
`@cf/meta/llama-4-scout-17b-16e-instruct` for snappy, plain-instruct output.

## How it works

```
public/index.html   single-file UI (blue & white, two panes, sliders, toggles)
src/index.js        Worker: POST /api/translate -> env.AI.run(..., { stream: true });
                    everything else -> env.ASSETS (the UI)
src/prompts.js      base personas + buildSystem() that turns the sliders/toggles
                    into a "## SETTINGS" block appended to the system prompt
wrangler.toml       [ai] binding, [assets] dir, MODEL var
```

The browser POSTs the text plus all control values; the Worker builds the system prompt
and streams Workers AI's SSE response (`data: {"response":"..."}`) straight back to the
page, which appends each token as it arrives.
