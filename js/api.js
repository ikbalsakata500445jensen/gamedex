/* GAMEDEX api layer. Keyless-first: Jikan + AniList (anime), CheapShark + Steam CDN (games).
   RAWG is optional and only ever uses a visitor-pasted key. All fetches time out and fail soft. */
(function () {
  "use strict";
  var JIKAN = "https://api.jikan.moe/v4";
  var ANILIST = "https://graphql.anilist.co";
  var SHARK = "https://www.cheapshark.com/api/1.0";
  var UA = { "User-Agent": "GAMEDEX/1.0 (free static catalog; contact: gamedex.local)" };

  function fetchJSON(url, opts) {
    opts = opts || {};
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, opts.timeout || 15000);
    var headers = {};
    if (opts.ua) { try { headers["User-Agent"] = UA["User-Agent"]; } catch (e) {} }
    return fetch(url, { method: opts.method || "GET", headers: Object.assign(headers, opts.headers || {}), body: opts.body, signal: ctrl.signal })
      .then(function (r) {
        clearTimeout(timer);
        if (!r.ok) { var e = new Error("HTTP " + r.status + " for " + url); e.status = r.status; throw e; }
        return r.json();
      })
      .catch(function (e) { clearTimeout(timer); throw e; });
  }

  /* Jikan: max ~3 req/sec. Serialize with a 700ms gap; retry once on 429. */
  var jikanQueue = Promise.resolve();
  function jikan(path, retry) {
    jikanQueue = jikanQueue.then(function () { return new Promise(function (res) { setTimeout(res, 700); }); });
    return jikanQueue.then(function () { return fetchJSON(JIKAN + path); }).catch(function (e) {
      if ((e.status === 429 || e.status === 504) && !retry) {
        return new Promise(function (res) { setTimeout(res, 2500); }).then(function () { return fetchJSON(JIKAN + path); });
      }
      throw e;
    });
  }

  function anilist(query, variables) {
    return fetchJSON(ANILIST, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ query: query, variables: variables || {} })
    });
  }

  var TRENDING_Q = "query ($page: Int, $per: Int) { Page(page: $page, perPage: $per) { media(type: ANIME, sort: TRENDING_DESC) { id idMal title { romaji english } coverImage { large extraLarge } bannerImage averageScore genres seasonYear format episodes status description studios { nodes { name } } } } }";
  var SEARCH_Q = "query ($q: String, $page: Int, $per: Int, $genre: [String], $year: Int, $status: MediaStatus, $sort: [MediaSort]) { Page(page: $page, perPage: $per) { pageInfo { hasNextPage total } media(type: ANIME, search: $q, genre_in: $genre, seasonYear: $year, status: $status, sort: $sort) { id idMal title { romaji english } coverImage { large } averageScore genres seasonYear format episodes status } } }";
  var DETAIL_Q = "query ($id: Int) { Media(id: $id, type: ANIME) { id idMal title { romaji english native } coverImage { large extraLarge } bannerImage averageScore meanScore popularity favourites genres seasonYear format episodes duration status source description studios { nodes { name } } trailer { id site } relations { edges { relationType } nodes { id title { romaji english } coverImage { large } averageScore format } } characters(page: 1, perPage: 6) { edges { role node { name { full } image { medium } } voiceActors(language: JAPANESE) { name { full } } } } } }";

  function shark(path) { return fetchJSON(SHARK + path, { ua: true }); }

  function steamHeader(appid) { return "https://cdn.akamai.steamstatic.com/steam/apps/" + appid + "/header.jpg"; }
  function steamCapsule(appid) { return "https://cdn.akamai.steamstatic.com/steam/apps/" + appid + "/capsule_616x353.jpg"; }
  function steamPortrait(appid) { return "https://cdn.akamai.steamstatic.com/steam/apps/" + appid + "/library_600x900.jpg"; }

  function rawg(path) {
    var key = (window.GDStore ? window.GDStore.getSettings().rawgKey : "") || "";
    if (!key) return Promise.reject(new Error("RAWG key not set"));
    var sep = path.indexOf("?") >= 0 ? "&" : "?";
    return fetchJSON("https://api.rawg.io/api" + path + sep + "key=" + encodeURIComponent(key));
  }

  window.GDAPI = {
    jikan: jikan, anilist: anilist, shark: shark, rawg: rawg,
    TRENDING_Q: TRENDING_Q, SEARCH_Q: SEARCH_Q, DETAIL_Q: DETAIL_Q,
    steamHeader: steamHeader, steamCapsule: steamCapsule, steamPortrait: steamPortrait,
    catalog: function (name) { return fetchJSON("data/" + name + ".json"); }
  };
})();
