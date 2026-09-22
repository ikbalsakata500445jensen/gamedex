# GAMEDEX: Every Game. Every Anime. One Shelf.

**Live: https://gamedex-omega.vercel.app**

A catalog site like IMDB, but for video games and anime. Two catalogs,
one roof. Trending rails, full-text search, filters by genre, platform,
status, year and score, a detail page for every title, and a personal
shelf (backlog plus watchlist) that lives in your browser. No account,
no cost, no tracking.

## How this was made

One prompt. That is the whole story.

GAMEDEX came out of a **single-shot prompt** to
[Vanexa Agent](https://github.com/ikbalsakata500445jensen/vanexa-agent),
running **Muse Spark 1.3 contributor**. The prompt ordered deep research
first (find free game and anime catalog APIs, discard anything paid) and
a complete static build second. One prompt went in, and out came six JS
modules, a video-rental-store identity, and a site that calls only free
public APIs straight from the browser.

I am human and humans make mistakes, so I will not claim it is perfect.
When two critical routing bugs showed up after launch (game and anime
detail links bouncing back to the lists), they got fixed, verified by
hand in a real browser, and redeployed. If you find the next bug, open
an issue and tell me straight.

## Run it

It is a static folder. Serve it and open it:

```bash
cd gamedex
python3 -m http.server 8000
```

Then open `http://localhost:8000`. Or deploy the folder to any static
host (Vercel, Cloudflare Pages, GitHub Pages).

## Where the data comes from (all free)

* Anime: AniList GraphQL (keyless) with Jikan/MyAnimeList as backup,
  plus a 12-title offline seed so the marquee never goes dark.
* Games: a 30-title staff catalog in `data/games.json` plus live
  CheapShark prices. Paste your own free RAWG key in Settings for
  the full RAWG catalog (20,000 requests a month, key stays in your
  browser, never hardcoded).

## License, and please read this part

**The code is MIT.** Fork it, learn from it, ship your own catalog,
sell it if you can, never tell me. Keep the license notice and we are
good. If one prompt built this, imagine what you can build on top of it.

**The data is NOT mine.** Titles, scores, covers and synopses belong to
their owners (AniList, MyAnimeList, RAWG, CheapShark, Steam) and come
through their free tiers under their terms. Covers hotlink from Steam,
MyAnimeList and AniList CDNs with their permission-by-API. Respect
their rate limits and they keep the free taps open for the rest of us.

## Credits

* Built in one shot by [Vanexa Agent](https://github.com/ikbalsakata500445jensen/vanexa-agent)
  with Muse Spark 1.3 contributor
* Bug fixes after launch: the human (routing order, seed fallbacks)
* Fonts: Archivo, Bungee and IBM Plex Mono (Google Fonts)
* Idea, prompt, and stubbornness: Ikbal Fadilah
