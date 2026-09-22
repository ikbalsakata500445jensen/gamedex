/* GAMEDEX store: localStorage shelf (backlog + watchlist) and settings. No backend. */
(function () {
  "use strict";
  var SHELF_KEY = "gamedex.shelf.v1";
  var SETTINGS_KEY = "gamedex.settings.v1";

  function loadJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) { return fallback; }
  }
  function saveJSON(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }

  /* Shelf entries: {kind:'game'|'anime', id:string, title:string, cover:string, meta:string, addedAt:number} */
  var Store = {
    getShelf: function () { return loadJSON(SHELF_KEY, []); },
    onShelf: function (kind, id) {
      return Store.getShelf().some(function (e) { return e.kind === kind && String(e.id) === String(id); });
    },
    add: function (entry) {
      var shelf = Store.getShelf();
      if (shelf.some(function (e) { return e.kind === entry.kind && String(e.id) === String(entry.id); })) return shelf;
      entry.addedAt = Date.now();
      shelf.unshift(entry);
      saveJSON(SHELF_KEY, shelf);
      document.dispatchEvent(new CustomEvent("gamedex:shelf", { detail: shelf }));
      return shelf;
    },
    remove: function (kind, id) {
      var shelf = Store.getShelf().filter(function (e) { return !(e.kind === kind && String(e.id) === String(id)); });
      saveJSON(SHELF_KEY, shelf);
      document.dispatchEvent(new CustomEvent("gamedex:shelf", { detail: shelf }));
      return shelf;
    },
    clear: function () {
      saveJSON(SHELF_KEY, []);
      document.dispatchEvent(new CustomEvent("gamedex:shelf", { detail: [] }));
    },
    getSettings: function () { return loadJSON(SETTINGS_KEY, { rawgKey: "" }); },
    saveSettings: function (s) { saveJSON(SETTINGS_KEY, s); }
  };

  window.GDStore = Store;
})();
