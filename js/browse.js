/* GAMEDEX browse: search + filter pages for games and anime. */
(function () {
  "use strict";
  var V = window.GDViews, API = window.GDAPI;
  var GAME_GENRES = ["RPG", "Action", "Adventure", "Indie", "Roguelike", "Souls-like", "Open World", "Story Rich", "Puzzle", "FPS", "Fighting", "Sim", "Strategy", "Co-op", "Horror", "Platformer"];
  var ANIME_GENRES = ["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Mystery", "Romance", "Sci-Fi", "Slice of Life", "Sports", "Thriller"];
  var ANIME_STATUS = [["FINISHED", "Finished"], ["RELEASING", "Airing"], ["NOT_YET_RELEASED", "Upcoming"], ["CANCELLED", "Cancelled"]];

  function params(qs) {
    var o = {};
    (qs || "").replace(/^\?/, "").split("&").forEach(function (p) {
      if (!p) return;
      var kv = p.split("=");
      o[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || "");
    });
    return o;
  }

  function filterBar(kind, p) {
    var genres = kind === "game" ? GAME_GENRES : ANIME_GENRES;
    var h = '<form class="filters" id="filterForm"><label>GENRE<select name="genre"><option value="">Any genre</option>' +
      genres.map(function (g) { return '<option value="' + g + '"' + (p.genre === g ? " selected" : "") + '>' + g + '</option>'; }).join("") + '</select></label>';
    if (kind === "game") {
      h += '<label>PLATFORM<select name="platform"><option value="">Any platform</option>' +
        ["PC", "PlayStation", "Xbox", "Switch"].map(function (pl) { return '<option' + (p.platform === pl ? " selected" : "") + '>' + pl + '</option>'; }).join("") + '</select></label>';
    } else {
      h += '<label>STATUS<select name="status"><option value="">Any status</option>' +
        ANIME_STATUS.map(function (s) { return '<option value="' + s[0] + '"' + (p.status === s[0] ? " selected" : "") + '>' + s[1] + '</option>'; }).join("") + '</select></label>';
    }
    h += '<label>YEAR<input type="number" name="year" min="1970" max="2030" placeholder="Any" value="' + V.esc(p.year || "") + '"></label>' +
      '<label>MIN SCORE<input type="number" name="min" min="0" max="10" step="0.5" placeholder="0" value="' + V.esc(p.min || "") + '"></label>' +
      '<button class="btn btn-red" type="submit">APPLY</button></form>';
    return h;
  }

  function gameMatches(g, p, q) {
    if (q && (g.title + " " + g.dev).toLowerCase().indexOf(q.toLowerCase()) < 0) return false;
    if (p.genre && g.genres.indexOf(p.genre) < 0) return false;
    if (p.platform && g.platforms.indexOf(p.platform) < 0) return false;
    if (p.year && String(g.year) !== String(p.year)) return false;
    if (p.min && g.score < parseFloat(p.min)) return false;
    return true;
  }

  function gamesPage(p, q) {
    return API.catalog("games").then(function (games) {
      var list = games.filter(function (g) { return gameMatches(g, p, q); });
      var h = '<section><div class="sec-head"><h2>' + (q ? 'Search: "' + V.esc(q) + '"' : 'Game Aisles') + '</h2><span class="sub">' + list.length + ' tapes found</span></div>' +
        '<div class="tabs" role="tablist"><button aria-selected="true">GAMES</button><button data-go="#/anime' + (q ? "?q=" + encodeURIComponent(q) : "") + '">ANIME</button></div>' +
        filterBar("game", p);
      if (!list.length) h += '<div class="empty"><p>No tapes match that combination. The back room is empty — try loosening a filter or two.</p></div>';
      else h += '<div class="receipt">' + list.map(function (g) {
        return '<a class="rrow" href="#/game/' + g.appid + '">' + V.img(API.steamHeader(g.appid), g.title) +
          '<span><span class="rtitle">' + V.esc(g.title) + '</span><br><span class="rmeta">' + g.year + " • " + V.esc(g.dev) + " • " + V.esc(g.genres.slice(0, 3).join(" / ")) + " • " + V.esc(g.platforms.join(" / ")) + '</span></span>' +
          '<span class="rscore">' + V.score(g.score) + '</span></a>';
      }).join("") + '</div></section>';
      return h;
    });
  }

  function animePage(p, q) {
    var vars = { q: q || undefined, page: 1, per: 24, genre: p.genre ? [p.genre] : undefined, year: p.year ? parseInt(p.year, 10) : undefined, status: p.status || undefined, sort: q ? ["SEARCH_MATCH"] : ["TRENDING_DESC"] };
    return API.anilist(API.SEARCH_Q, vars).then(function (res) {
      var media = (res.data.Page && res.data.Page.media) || [];
      if (p.min) media = media.filter(function (m) { return (m.averageScore || 0) / 10 >= parseFloat(p.min); });
      var h = '<section><div class="sec-head"><h2>' + (q ? 'Search: "' + V.esc(q) + '"' : 'Anime Marquee') + '</h2><span class="sub">' + media.length + ' showings • live via AniList</span></div>' +
        '<div class="tabs" role="tablist"><button data-go="#/games' + (q ? "?q=" + encodeURIComponent(q) : "") + '">GAMES</button><button aria-selected="true">ANIME</button></div>' +
        filterBar("anime", p);
      if (!media.length) h += '<div class="empty"><p>The projector is empty for that query. Check the spelling, or try the Jikan mirror by opening a title directly.</p></div>';
      else h += '<div class="receipt">' + media.map(function (m) {
        var t = m.title.english || m.title.romaji;
        return '<a class="rrow" href="#/anime/a' + m.id + '">' + V.img(m.coverImage.large, t) +
          '<span><span class="rtitle">' + V.esc(t) + '</span><br><span class="rmeta">' + (m.seasonYear || "?") + " • " + V.esc(m.format || "?") + " • " + V.esc((m.genres || []).slice(0, 3).join(" / ")) + " • " + (m.episodes || "?") + ' eps</span></span>' +
          '<span class="rscore">' + V.score(m.averageScore != null ? m.averageScore / 10 : null) + '</span></a>';
      }).join("") + '</div></section>';
      return h;
    }).catch(function () {
      /* Offline fallback: local anime seed */
      return API.catalog("anime").then(function (seed) {
        var list = seed.filter(function (a) {
          if (q && a.title.toLowerCase().indexOf(q.toLowerCase()) < 0) return false;
          if (p.genre && a.genres.indexOf(p.genre) < 0) return false;
          if (p.year && String(a.year) !== String(p.year)) return false;
          if (p.min && a.score < parseFloat(p.min)) return false;
          return true;
        });
        var h = '<section><div class="sec-head"><h2>' + (q ? 'Search: "' + V.esc(q) + '"' : 'Anime Marquee') + '</h2><span class="sub">' + list.length + ' showings • offline shelf copy</span></div>' +
          '<div class="tabs" role="tablist"><button data-go="#/games">GAMES</button><button aria-selected="true">ANIME</button></div>' + filterBar("anime", p) +
          '<div class="receipt">' + list.map(function (a) {
            return '<a class="rrow" href="#/anime/' + a.mal_id + '">' + V.img(a.img || ("https://cdn.myanimelist.net/images/anime/" + (a.mal_id % 50) + "/1.jpg"), a.title) +
              '<span><span class="rtitle">' + V.esc(a.title) + '</span><br><span class="rmeta">' + a.year + " • " + V.esc(a.studio) + " • " + V.esc(a.genres.slice(0, 3).join(" / ")) + '</span></span>' +
              '<span class="rscore">' + V.score(a.score) + '</span></a>';
          }).join("") + '</div></section>';
        return h;
      });
    });
  }

  window.GDBrowse = { params: params, gamesPage: gamesPage, animePage: animePage };
})();
