/* GAMEDEX router + home assembly. Hash routes, error toast, shelf wiring. */
(function () {
  "use strict";
  var V = window.GDViews, API = window.GDAPI, S = window.GDStore;
  var view = document.getElementById("view");
  var errBox = document.getElementById("errlog");
  var errTimer = null;

  function toast(msg) {
    errBox.textContent = msg;
    errBox.hidden = false;
    clearTimeout(errTimer);
    errTimer = setTimeout(function () { errBox.hidden = true; }, 5000);
  }
  function loading(label) { view.innerHTML = '<p class="loading">' + (label || "REWINDING") + '</p>'; }
  function paint(html) { view.innerHTML = html; wire(); window.scrollTo(0, 0); }
  function updateCount() {
    var n = S.getShelf().length;
    var el = document.getElementById("shelfCount");
    if (el) el.textContent = n;
  }
  document.addEventListener("gamedex:shelf", updateCount);

  /* Global click delegation: shelf buttons, tabs, returns */
  function wire() {
    view.querySelectorAll("[data-go]").forEach(function (b) {
      b.addEventListener("click", function () { location.hash = b.getAttribute("data-go"); });
    });
    view.querySelectorAll(".shelf-btn").forEach(function (b) {
      b.addEventListener("click", function () {
        var kind = b.getAttribute("data-kind"), id = b.getAttribute("data-id");
        if (S.onShelf(kind, id)) { S.remove(kind, id); toast("Returned to the shelf. No late fee."); }
        else {
          S.add({ kind: kind, id: id, title: b.getAttribute("data-title"), cover: b.getAttribute("data-cover"), meta: b.getAttribute("data-meta") });
          toast(kind === "game" ? "Added to your backlog. Play it loud." : "Added to your watchlist. Popcorn ready.");
        }
        rerender();
      });
    });
    view.querySelectorAll(".locker .rm").forEach(function (b) {
      b.addEventListener("click", function (e) { e.preventDefault(); S.remove(b.getAttribute("data-kind"), b.getAttribute("data-id")); rerender(); });
    });
    var clear = document.getElementById("clearShelf");
    if (clear) clear.addEventListener("click", function () { S.clear(); rerender(); });
    var wipe = document.getElementById("wipe");
    if (wipe) wipe.addEventListener("click", function () { S.clear(); updateCount(); toast("Shelf cleared. Fresh start, fresh rentals."); });
    var save = document.getElementById("saveKeys");
    if (save) save.addEventListener("click", function () {
      var s = S.getSettings();
      s.rawgKey = (document.getElementById("rawgKey").value || "").trim();
      S.saveSettings(s);
      toast("Key saved in this browser only.");
      rerender();
    });
    var ff = document.getElementById("filterForm");
    if (ff) ff.addEventListener("submit", function (e) {
      e.preventDefault();
      var fd = new FormData(ff);
      var qs = [];
      ["genre", "platform", "status", "year", "min"].forEach(function (k) {
        var v = (fd.get(k) || "").toString().trim();
        if (v) qs.push(k + "=" + encodeURIComponent(v));
      });
      var base = location.hash.split("?")[0];
      location.hash = base + (qs.length ? "?" + qs.join("&") : "");
    });
  }

  function home() {
    loading("STOCKING SHELVES");
    var gamesP = API.catalog("games");
    var animeP = API.anilist(API.TRENDING_Q, { page: 1, per: 10 })
      .then(function (r) { return (r.data.Page && r.data.Page.media) || []; })
      .catch(function () {
        return API.catalog("anime").then(function (seed) {
          return seed.slice(0, 10).map(function (a) {
            /* offline shelf copy: these ids are MAL ids, flagged so cards
               link without the AniList "a" prefix */
            return { id: a.mal_id, __seed: true, title: { romaji: a.title, english: a.title }, coverImage: { large: a.img || "" }, averageScore: a.score * 10, format: a.type, seasonYear: a.year };
          });
        });
      });
    var dealsP = API.shark("/deals?storeID=1&upperPrice=15&pageSize=8").then(function (d) { return d; }).catch(function () { return []; });
    Promise.all([gamesP, animeP, dealsP]).then(function (parts) {
      var games = parts[0], anime = parts[1], deals = parts[2];
      var dealGames = [];
      var byTitle = {};
      games.forEach(function (g) { byTitle[g.title.toLowerCase()] = g; });
      (deals || []).forEach(function (d) {
        var g = byTitle[(d.title || "").toLowerCase()];
        if (g && dealGames.length < 6 && !dealGames.some(function (x) { return x.appid === g.appid; })) dealGames.push(g);
      });
      paint(V.homeView(games, anime, dealGames));
    }).catch(function (e) { paint('<section><div class="empty"><p>The store failed to open: ' + V.esc(e.message) + '</p></div></section>'); });
  }

  function route() {
    var raw = (location.hash || "#/").replace(/^#/, "");
    var qpos = raw.indexOf("?");
    var path = qpos >= 0 ? raw.slice(0, qpos) : raw;
    var p = window.GDBrowse.params(qpos >= 0 ? raw.slice(qpos) : "");
    var segs = path.split("/").filter(Boolean);
    document.querySelectorAll(".mainnav a").forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("href") === "#" + path.split("?")[0]);
    });
    if (!segs.length) return home();
    /* Detail routes BEFORE list routes: "#/anime/a123" must reach the
       reel, not fall into the "#/anime" marquee branch above it. The old
       order swallowed every anime detail link back into the list. */
    if (segs[0] === "game" && segs[1]) {
      loading("PULLING THE TAPE");
      return window.GDDetail.gameDetail(segs[1]).then(function (res) {
        paint(res.html);
        if (res.game) {
          API.shark("/games?title=" + encodeURIComponent(res.game.title) + "&limit=1").then(function (d) {
            var el = document.getElementById("livePrice");
            if (el && d && d[0]) el.innerHTML = '<p class="byline">LIVE: cheapest <strong>$' + V.esc(d[0].cheapest) + '</strong> via CheapShark. <a href="https://www.cheapshark.com/redirect?dealID=' + encodeURIComponent(d[0].cheapestDealID) + '" target="_blank" rel="noopener">Grab the deal</a></p>';
            else if (el) el.innerHTML = '<p class="byline">No live deal found — check the Steam page above.</p>';
          }).catch(function () {
            var el = document.getElementById("livePrice");
            if (el) el.innerHTML = '<p class="byline">Price check offline — check the Steam page above.</p>';
          });
        }
      }).catch(function (e) { paint('<section><div class="empty"><p>Tape damaged: ' + V.esc((e && e.message) || "unknown") + '</p><a class="btn" href="#/games">BACK TO GAMES</a></div></section>'); });
    }
    if (segs[0] === "anime" && segs[1]) {
      loading("THREADING THE REEL");
      return window.GDDetail.animeDetail(segs[1]).then(function (res) { paint(res.html); })
        .catch(function (e) { paint('<section><div class="empty"><p>Reel jammed: ' + V.esc((e && e.message) || "unknown") + '</p><a class="btn" href="#/anime">BACK TO MARQUEE</a></div></section>'); });
    }
    if (segs[0] === "games") {
      loading("WALKING THE AISLES");
      return window.GDBrowse.gamesPage(p, p.q || "").then(paint).catch(function (e) { paint('<section><div class="empty"><p>Aisle closed: ' + V.esc(e.message) + '</p></div></section>'); });
    }
    if (segs[0] === "anime") {
      loading("THREADING THE PROJECTOR");
      return window.GDBrowse.animePage(p, p.q || "").then(paint).catch(function (e) { paint('<section><div class="empty"><p>Projector jammed: ' + V.esc(e.message) + '</p></div></section>'); });
    }
    if (segs[0] === "shelf") return paint(V.shelfView(S.getShelf()));
    if (segs[0] === "settings") {
      loading("OPENING THE REGISTER");
      var checks = [
        API.anilist(API.TRENDING_Q, { page: 1, per: 1 }).then(function () { return { name: "AniList GraphQL", ok: true, note: "keyless, CORS open" }; }).catch(function () { return { name: "AniList GraphQL", ok: false, note: "unreachable" }; }),
        API.jikan("/anime/1").then(function () { return { name: "Jikan (MyAnimeList)", ok: true, note: "keyless, 3 req/sec" }; }).catch(function () { return { name: "Jikan (MyAnimeList)", ok: false, note: "rate-limited or down — AniList covers" }; }),
        API.shark("/deals?storeID=1&pageSize=1").then(function () { return { name: "CheapShark deals", ok: true, note: "keyless, CORS open" }; }).catch(function () { return { name: "CheapShark deals", ok: false, note: "unreachable" }; })
      ];
      var key = S.getSettings().rawgKey;
      var rawgP = key ? API.rawg("/games?page_size=1").then(function () { return { name: "RAWG (your key)", ok: true, note: "key accepted" }; }).catch(function () { return { name: "RAWG (your key)", ok: false, note: "key rejected" }; })
        : Promise.resolve({ name: "RAWG (optional)", ok: true, note: "no key pasted — staff catalog in use" });
      return Promise.all(checks.concat([rawgP])).then(function (status) { paint(V.settingsView(S.getSettings(), status)); });
    }
    paint('<section><div class="empty"><p>Wrong aisle. That page does not exist.</p><a class="btn" href="#/">BACK TO THE FRONT DESK</a></div></section>');
  }

  function rerender() { route(); }

  document.getElementById("searchbar").addEventListener("submit", function (e) {
    e.preventDefault();
    var q = document.getElementById("q").value.trim();
    location.hash = "#/games" + (q ? "?q=" + encodeURIComponent(q) : "");
    if ((location.hash || "").indexOf("#/games") === 0) route();
  });

  window.addEventListener("hashchange", route);
  window.GDToast = toast;
  updateCount();
  route();
})();
