/* GAMEDEX views: home rails + shelf + settings. */
(function () {
  "use strict";
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function img(src, alt, lazy) { return '<img src="' + esc(src) + '" alt="' + esc(alt) + '"' + (lazy === false ? "" : ' loading="lazy"') + ' onerror="this.style.opacity=.25">'; }
  function score(v) { return (v == null || v === "" || v === 0) ? "—" : (Math.round(v * 10) / 10); }

  function vhsCard(g) {
    return '<a class="vhs" href="#/game/' + g.appid + '">' +
      '<span class="score-stamp">' + score(g.score) + '</span>' +
      img(window.GDAPI.steamCapsule(g.appid), g.title + " cover") +
      '<span class="spine">GAMEDEX RENTAL • ' + esc(g.year) + '</span>' +
      '<span class="vbody"><span class="vtitle">' + esc(g.title) + '</span>' +
      '<span class="vmeta">' + esc(g.dev) + " • " + esc(g.genres.slice(0, 2).join(" / ")) + '</span></span></a>';
  }
  function showCard(a) {
    var t = a.title.english || a.title.romaji;
    var cover = (a.coverImage && (a.coverImage.extraLarge || a.coverImage.large)) || "";
    /* seed items carry MAL ids: link them bare, or the detail lookup
       reads them as AniList ids and misses the shelf copy */
    var href = a.__seed ? "#/anime/" + a.id : "#/anime/a" + a.id;
    return '<a class="show" href="' + href + '">' +
      img(cover, t + " key visual") +
      '<span class="sbody"><span class="stitle">' + esc(t) + '</span>' +
      '<span class="chips"><span class="chip score">' + score(a.averageScore != null ? a.averageScore / 10 : null) + '</span>' +
      '<span class="chip">' + esc(a.format || "?") + '</span>' +
      (a.seasonYear ? '<span class="chip">' + a.seasonYear + '</span>' : "") + '</span></span></a>';
  }
  function stubCard(g) {
    return '<a class="stub" href="#/game/' + g.appid + '"><span class="perf"></span><span class="tbody">' +
      img(window.GDAPI.steamHeader(g.appid), g.title + " art") +
      '<span class="ttitle">' + esc(g.title) + '</span>' +
      '<span class="tmeta">ADMIT ONE • ' + esc(g.platforms.slice(0, 3).join(" / ")) + '</span>' +
      '<span class="price">SCORE ' + score(g.score) + '</span></span></a>';
  }

  function homeView(games, anime, deals) {
    var picks = games.slice(0, 3);
    var genres = {};
    games.forEach(function (g) { g.genres.forEach(function (gn) { genres[gn] = (genres[gn] || 0) + 1; }); });
    var genreList = Object.keys(genres).sort().slice(0, 10);
    return '' +
    '<section class="marquee"><span class="open-sign">OPEN LATE</span>' +
      '<p class="kicker">NOW RENTING • GAMES + ANIME</p>' +
      '<h1>Stop scrolling.<br><em>Start watching.</em><br>Start playing.</h1>' +
      '<p>The video store never died — it just moved into your browser. ' + games.length + ' staff-picked games, the seasonal anime charts, and a shelf with your name on it. Free forever, no card required.</p>' +
      '<div class="cta-row"><a class="btn btn-red" href="#/games">BROWSE GAMES</a>' +
      '<a class="btn btn-ink" href="#/anime">BROWSE ANIME</a></div></section>' +
    '<section><div class="sec-head"><h2>New on the Game Shelf</h2><span class="sub">VHS • be kind, rewind</span><a class="more" href="#/games">Full aisle →</a></div>' +
      '<div class="rail">' + games.slice(0, 12).map(vhsCard).join("") + '</div><div class="shelf-bar"></div></section>' +
    '<section class="board"><div class="sec-head" style="border-color:#f4ead5"><h2 style="color:#f4ead5">Tonight on the Anime Marquee</h2><span class="sub" style="color:#e9dcc0">Now showing • trending</span><a class="more" style="color:#f0b9b4" href="#/anime">All showtimes →</a></div>' +
      '<div class="board-row">' + anime.map(showCard).join("") + '</div></section>' +
    '<section><div class="sec-head"><h2>Double-Feature Tickets</h2><span class="sub">High scores, low prices</span></div>' +
      '<div class="rail">' + (deals.length ? deals.map(stubCard).join("") : games.slice(12, 18).map(stubCard).join("")) + '</div></section>' +
    '<section><div class="sec-head"><h2>Store Directory</h2><span class="sub">Aisles 1–4</span></div>' +
      '<div class="aisles"><div class="aisle"><h3>GAME AISLES</h3><ul>' +
      genreList.slice(0, 5).map(function (g) { return '<li><a href="#/games?genre=' + encodeURIComponent(g) + '"><span>' + esc(g) + '</span><span class="n">' + genres[g] + ' tapes</span></a></li>'; }).join("") +
      '</ul></div><div class="aisle"><h3>ANIME AISLES</h3><ul>' +
      '<li><a href="#/anime?genre=Action"><span>Action</span><span class="n">marquee</span></a></li>' +
      '<li><a href="#/anime?genre=Drama"><span>Drama</span><span class="n">marquee</span></a></li>' +
      '<li><a href="#/anime?genre=Comedy"><span>Comedy</span><span class="n">marquee</span></a></li>' +
      '<li><a href="#/anime?genre=Sci-Fi"><span>Sci-Fi</span><span class="n">marquee</span></a></li>' +
      '<li><a href="#/anime?genre=Romance"><span>Romance</span><span class="n">marquee</span></a></li>' +
      '</ul></div></div></section>' +
    '<section><div class="sec-head"><h2>Staff Picks</h2><span class="sub">Index cards from behind the counter</span></div>' +
      '<div class="picks">' + picks.map(function (g, i) {
        return '<article class="pick"><p class="who">Clerk ' + ["Mara", "Dev", "June"][i % 3] + ' recommends</p>' +
        '<h3><a href="#/game/' + g.appid + '">' + esc(g.title) + '</a></h3>' +
        '<hr class="rule"><p>' + esc(g.blurb) + '</p>' +
        '<p class="who">' + esc(g.tag) + ' — score ' + score(g.score) + '</p></article>';
      }).join("") + '</div></section>';
  }

  function shelfView(shelf) {
    if (!shelf.length) {
      return '<section><div class="sec-head"><h2>My Shelf</h2><span class="sub">0 rentals checked out</span></div>' +
        '<div class="empty"><p>The shelf is bare. The clerks are judging you (lovingly). Go rent something — it lives here, in this browser, no account needed.</p>' +
        '<a class="btn btn-red" href="#/games">BROWSE GAMES</a> <a class="btn" href="#/anime">BROWSE ANIME</a></div></section>';
    }
    var games = shelf.filter(function (e) { return e.kind === "game"; });
    var anime = shelf.filter(function (e) { return e.kind === "anime"; });
    function locker(e) {
      var href = e.kind === "game" ? "#/game/" + e.id : "#/anime/" + e.id;
      return '<div class="locker"><a href="' + href + '" style="text-decoration:none;color:inherit">' +
        img(e.cover, e.title) +
        '<span class="lbody"><span class="ltitle">' + esc(e.title) + '</span><span class="lmeta">' + esc(e.meta || "") + '</span></span></a>' +
        '<span class="lbody"><button class="rm" data-kind="' + e.kind + '" data-id="' + esc(e.id) + '">RETURN TAPE</button></span></div>';
    }
    return '<section><div class="sec-head"><h2>My Shelf</h2><span class="sub">' + shelf.length + ' checked out</span>' +
      '<button class="btn" id="clearShelf" style="margin-left:auto">RETURN ALL</button></div>' +
      (games.length ? '<div class="sec-head"><h2 style="font-size:20px">Game Backlog</h2><span class="sub">' + games.length + '</span></div><div class="lockers">' + games.map(locker).join("") + '</div>' : "") +
      (anime.length ? '<div class="sec-head" style="margin-top:26px"><h2 style="font-size:20px">Anime Watchlist</h2><span class="sub">' + anime.length + '</span></div><div class="lockers">' + anime.map(locker).join("") + '</div>' : "") +
      '</section>';
  }

  function settingsView(settings, status) {
    return '<section><div class="sec-head"><h2>Settings</h2><span class="sub">Behind the counter</span></div>' +
    '<div class="slip"><h3 style="font-family:var(--disp);margin-top:0">API STATUS SLIP</h3>' +
    '<ul class="status-list">' + status.map(function (s) {
      return '<li><span class="' + (s.ok ? "ok" : "bad") + '">' + (s.ok ? "ONLINE" : "OFFLINE") + '</span> — ' + esc(s.name) + ' <span style="color:var(--ink-soft)">' + esc(s.note) + '</span></li>';
    }).join("") + '</ul>' +
    '<hr class="rule"><label>RAWG API KEY (OPTIONAL — PASTE YOUR OWN FREE KEY)' +
    '<input type="text" id="rawgKey" value="' + esc(settings.rawgKey || "") + '" placeholder="e.g. 9f8e7d…" autocomplete="off"></label>' +
    '<p style="font-size:13px;color:var(--ink-soft)">Get a free key at rawg.io/apidocs (20,000 requests/month). It stays in your browser — never sent anywhere except RAWG. Without it, games come from the GAMEDEX staff catalog plus live CheapShark prices.</p>' +
    '<button class="btn btn-red" id="saveKeys">SAVE KEY</button> <button class="btn" id="wipe">RETURN ALL TAPES (CLEAR SHELF)</button></div></section>';
  }

  window.GDViews = { esc: esc, img: img, score: score, vhsCard: vhsCard, showCard: showCard, stubCard: stubCard, homeView: homeView, shelfView: shelfView, settingsView: settingsView };
})();
