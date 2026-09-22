/* GAMEDEX detail pages: rental box (games), cinema program (anime). */
(function () {
  "use strict";
  var V = window.GDViews, API = window.GDAPI, S = window.GDStore;

  function shelfBtn(kind, id, title, cover, meta) {
    var on = S.onShelf(kind, id);
    return '<button class="shelf-btn' + (on ? " on" : "") + '" data-kind="' + kind + '" data-id="' + V.esc(id) + '" data-title="' + V.esc(title) + '" data-cover="' + V.esc(cover) + '" data-meta="' + V.esc(meta) + '">' +
      (on ? "ON YOUR SHELF — TAP TO RETURN" : (kind === "game" ? "ADD TO BACKLOG" : "ADD TO WATCHLIST")) + '</button>';
  }

  function gameDetail(appid) {
    return API.catalog("games").then(function (games) {
      var g = null;
      for (var i = 0; i < games.length; i++) if (String(games[i].appid) === String(appid)) { g = games[i]; break; }
      if (!g) return { html: '<section><div class="empty"><p>That tape is not on our shelf. It may be checked out, or the ID is wrong.</p><a class="btn" href="#/games">BACK TO GAMES</a></div></section>' };
      var similar = games.filter(function (x) { return x.appid !== g.appid && x.genres.some(function (gn) { return g.genres.indexOf(gn) >= 0; }); }).slice(0, 4);
      var h = '<section><div class="rental"><div class="box-front">' +
        V.img(API.steamCapsule(g.appid), g.title + " box art", false) +
        '<div class="spine-label">GAMEDEX RENTAL • ' + V.esc(g.year) + ' • ' + V.esc(g.platforms.join(" / ")) + '</div></div>' +
        '<div class="box-back"><h1>' + V.esc(g.title) + '</h1>' +
        '<p class="byline">DIR. ' + V.esc(g.dev.toUpperCase()) + ' • ' + g.year + ' • ' + V.esc(g.time) + ' • SCORE ' + V.score(g.score) + '/100</p>' +
        '<p><em>' + V.esc(g.tag) + '</em></p><p>' + V.esc(g.blurb) + '</p>' +
        '<table class="spec"><tr><th>GENRES</th><td>' + V.esc(g.genres.join(", ")) + '</td></tr>' +
        '<tr><th>PLATFORMS</th><td>' + V.esc(g.platforms.join(", ")) + '</td></tr>' +
        '<tr><th>PLAYTIME</th><td>' + V.esc(g.time) + '</td></tr>' +
        '<tr><th>STEAM</th><td><a href="https://store.steampowered.com/app/' + g.appid + '/" target="_blank" rel="noopener">Open store page</a></td></tr>' +
        '<tr><th>PRICE CHECK</th><td><a href="https://www.cheapshark.com/api/1.0/games?title=' + encodeURIComponent(g.title) + '" target="_blank" rel="noopener">Live deal lookup (CheapShark)</a></td></tr></table>' +
        '<div id="livePrice"><p class="byline">Checking live prices…</p></div>' +
        shelfBtn("game", g.appid, g.title, API.steamHeader(g.appid), g.year + " • " + g.dev) +
        ' <a class="btn" href="#/games">BACK TO AISLE</a></div></div></section>' +
        '<section><div class="sec-head"><h2>Customers Also Rented</h2><span class="sub">Same genres</span></div>' +
        '<div class="rail">' + similar.map(V.vhsCard).join("") + '</div><div class="shelf-bar"></div></section>';
      return { html: h, game: g };
    });
  }

  function cleanDesc(html) {
    if (!html) return "";
    var t = html.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "");
    return t.length > 900 ? t.slice(0, 900).trim() + "…" : t;
  }

  function animeDetail(id) {
    var isAni = String(id).charAt(0) === "a";
    var q = isAni ? API.DETAIL_Q : null;
    var p = isAni
      ? API.anilist(q, { id: parseInt(String(id).slice(1), 10) }).then(function (r) { return r.data.Media; })
      : API.jikan("/anime/" + id).then(function (r) { return r.data; });
    return p.then(function (m) {
      var title, cover, banner, scoreV, genres, year, format, eps, status, desc, studios, trailer, rels, chars;
      if (isAni) {
        title = m.title.english || m.title.romaji;
        cover = m.coverImage.extraLarge || m.coverImage.large;
        banner = m.bannerImage || cover;
        scoreV = m.averageScore != null ? m.averageScore / 10 : (m.meanScore != null ? m.meanScore / 10 : null);
        genres = m.genres || []; year = m.seasonYear; format = m.format; eps = m.episodes; status = m.status;
        desc = cleanDesc(m.description);
        studios = (m.studios.nodes || []).map(function (s) { return s.name; });
        trailer = m.trailer && m.trailer.site === "youtube" ? m.trailer.id : null;
        rels = ((m.relations || {}).nodes || []).slice(0, 4);
        chars = ((m.characters || {}).edges || []).slice(0, 6);
      } else {
        title = m.title_english || m.title;
        cover = m.images.jpg.large_image_url;
        banner = cover; scoreV = m.score; genres = m.genres.map(function (g) { return g.name; });
        year = m.year; format = m.type; eps = m.episodes; status = m.status;
        desc = (m.synopsis || "").replace("[Written by MAL Rewrite]", "").trim();
        studios = m.studios.map(function (s) { return s.name; });
        trailer = m.trailer && m.trailer.youtube_id ? m.trailer.youtube_id : null;
        rels = []; chars = [];
      }
      var h = '<section>' + V.img(banner, title + " banner", false).replace("<img", '<img class="program-banner"') +
        '<div class="program"><div>' + V.img(cover, title + " poster", false).replace("<img", '<img class="poster"') + '</div>' +
        '<div><h1>' + V.esc(title) + '</h1>' +
        '<p class="byline">' + (year || "?") + ' • ' + V.esc(format || "?") + ' • ' + (eps || "?") + ' EPISODES • ' + V.esc(status || "?") + ' • SCORE ' + V.score(scoreV) + '/10</p>' +
        '<p><span class="chips" style="display:flex;gap:6px;flex-wrap:wrap">' + genres.map(function (g) { return '<span class="chip" style="color:var(--red-dark);border-color:var(--red-dark)">' + V.esc(g) + '</span>'; }).join("") + '</span></p>' +
        '<div class="synopsis"><p>' + V.esc(desc || "No synopsis on file. The projectionist apologizes.").split("\n").join("</p><p>") + '</p></div>' +
        '<table class="spec"><tr><th>STUDIOS</th><td>' + V.esc(studios.join(", ") || "Unknown") + '</td></tr>' +
        '<tr><th>STATUS</th><td>' + V.esc(status || "?") + '</td></tr>' +
        '<tr><th>EPISODES</th><td>' + (eps || "?") + (m.duration ? " • " + V.esc(m.duration) : "") + '</td></tr></table>' +
        shelfBtn("anime", isAni ? id : m.mal_id, title, cover, (year || "") + " • " + (studios[0] || "")) +
        ' <a class="btn" href="#/anime">BACK TO MARQUEE</a>' +
        (trailer ? '<div class="trailer"><iframe src="https://www.youtube-nocookie.com/embed/' + trailer + '" title="Trailer" loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>' : "") +
        '</div></div></section>';
      if (chars.length) {
        h += '<section><div class="sec-head"><h2>Cast Board</h2><span class="sub">Top-billed voices</span></div><div class="rail">' +
          chars.map(function (c) {
            var va = (c.voiceActors && c.voiceActors[0] && c.voiceActors[0].name.full) || "—";
            return '<div class="stub"><span class="perf"></span><span class="tbody">' + V.img(c.node.image.medium, c.node.name.full) +
              '<span class="ttitle">' + V.esc(c.node.name.full) + '</span><span class="tmeta">' + V.esc(c.role) + ' • VA ' + V.esc(va) + '</span></span></div>';
          }).join("") + '</div></section>';
      }
      if (rels.length) {
        h += '<section><div class="sec-head"><h2>Also on This Reel</h2><span class="sub">Related titles</span></div><div class="rail">' +
          rels.map(function (r) {
            var t = r.title.english || r.title.romaji;
            return '<a class="show" style="flex-basis:240px" href="#/anime/a' + r.id + '">' + V.img(r.coverImage.large, t) +
              '<span class="sbody"><span class="stitle">' + V.esc(t) + '</span><span class="chips"><span class="chip score">' + V.score(r.averageScore != null ? r.averageScore / 10 : null) + '</span><span class="chip">' + V.esc(r.format || "") + '</span></span></span></a>';
          }).join("") + '</div></section>';
      }
      return { html: h, anime: { id: isAni ? id : m.mal_id, title: title } };
    }).catch(function () {
      return API.catalog("anime").then(function (seed) {
        /* offline shelf copy: match MAL ids with or without the AniList
           "a" prefix, so a dead API never strands a reel */
        var want = String(id).replace(/^a/, "");
        var a = null;
        for (var i = 0; i < seed.length; i++) if (String(seed[i].mal_id) === want || String(seed[i].mal_id) === String(id)) { a = seed[i]; break; }
        if (!a) return { html: '<section><div class="empty"><p>That reel is missing from the archive. The projectionist is looking into it.</p><a class="btn" href="#/anime">BACK TO MARQUEE</a></div></section>' };
        var h = '<section><div class="program" style="margin-top:0"><div>' + V.img(a.img || "", a.title + " poster", false).replace("<img", '<img class="poster"') + '</div>' +
          '<div><h1 style="margin-top:0">' + V.esc(a.title) + '</h1>' +
          '<p class="byline">' + a.year + ' • ' + V.esc(a.type) + ' • ' + a.eps + ' EPISODES • SCORE ' + V.score(a.score) + '/10</p>' +
          '<div class="synopsis"><p>' + V.esc(a.blurb) + ' (Offline shelf copy — connect for full synopsis, cast, and trailers.)</p></div>' +
          '<table class="spec"><tr><th>STUDIO</th><td>' + V.esc(a.studio) + '</td></tr><tr><th>STATUS</th><td>' + V.esc(a.status) + '</td></tr></table>' +
          shelfBtn("anime", a.mal_id, a.title, a.img || "", a.year + " • " + a.studio) +
          ' <a class="btn" href="#/anime">BACK TO MARQUEE</a></div></div></section>';
        return { html: h };
      });
    });
  }

  window.GDDetail = { gameDetail: gameDetail, animeDetail: animeDetail };
})();
