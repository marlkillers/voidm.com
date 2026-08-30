(function () {
  "use strict";

  var GH_USER = "marlkiller";

  /* ---------- theme: follow system + manual override ---------- */
  var root = document.documentElement;
  var stored = localStorage.getItem("voidm-theme");

  function applyTheme() {
    if (stored === "light" || stored === "dark") {
      root.setAttribute("data-theme", stored);
    } else {
      root.setAttribute("data-theme", "auto");
    }
  }
  applyTheme();

  var toggle = document.getElementById("theme-toggle");
  var meta = document.querySelector('meta[name="theme-color"]');
  function syncMeta() {
    var theme = root.getAttribute("data-theme");
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    var isDark =
      theme === "dark" || (theme === "auto" && mq.matches);
    if (meta) meta.setAttribute("content", isDark ? "#0b0d10" : "#ffffff");
  }
  toggle.addEventListener("click", function () {
    var cur = root.getAttribute("data-theme");
    if (cur === "auto") {
      // resolve to actual current appearance first
      var resolved = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      var next = resolved === "dark" ? "light" : "dark";
      stored = next;
      root.setAttribute("data-theme", next);
    } else {
      var n2 = cur === "dark" ? "light" : "dark";
      stored = n2;
      root.setAttribute("data-theme", n2);
    }
    localStorage.setItem("voidm-theme", stored);
    syncMeta();
  });
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", function () {
      if (root.getAttribute("data-theme") === "auto") {
        root.setAttribute("data-theme", "auto");
        syncMeta();
      }
    });
  syncMeta();

  /* ---------- footer year ---------- */
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- articles (from data/articles.json) ---------- */
  var articleList = document.getElementById("articles-list");
  if (articleList) {
    fetch("data/articles.json")
      .then(function (res) {
        if (!res.ok) throw new Error(res.status);
        return res.json();
      })
      .then(function (list) {
        if (!Array.isArray(list) || !list.length) return;
        list.forEach(function (a) {
          var row = document.createElement("div");
          row.className = "item";

          var val = document.createElement("span");
          val.className = "val";
          if (a.url) {
            var link = document.createElement("a");
            link.href = a.url;
            link.target = "_blank";
            link.rel = "noopener";
            link.textContent = a.title || a.url;
            val.appendChild(link);
            if (a.live) {
              var live = document.createElement("a");
              live.href = a.live;
              live.target = "_blank";
              live.rel = "noopener";
              live.className = "live";
              live.textContent = "↗";
              val.appendChild(live);
            }
            if (a.label) {
              var tag = document.createElement("span");
              tag.className = "tag";
              tag.textContent = a.label;
              val.appendChild(tag);
            }
          } else {
            val.textContent = a.title || "";
          }
          row.appendChild(val);

          if (a.date) {
            var date = document.createElement("span");
            date.className = "date";
            date.textContent = a.date;
            row.appendChild(date);
          }
          articleList.appendChild(row);
        });
      })
      .catch(function () {});
  }

  /* ---------- GitHub repos (client-side fetch) ---------- */
  var repos = document.getElementById("repos");
  var hint = document.querySelector("#projects .hint");
  var API = "https://api.github.com/users/" + GH_USER + "/repos?per_page=100&sort=updated";

  function repoLink(r) {
    var a = document.createElement("a");
    a.href = r.html_url;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = r.name;
    return a;
  }

  function render(list) {
    if (!list.length) {
      repos.innerHTML = '<div class="item"><span class="val">No public repos.</span></div>';
      return;
    }
    list.sort(function (a, b) {
      return (b.stargazers_count || 0) - (a.stargazers_count || 0);
    });
    list.forEach(function (r) {
      var row = document.createElement("div");
      row.className = "item";
      var val = document.createElement("span");
      val.className = "val";
      val.appendChild(repoLink(r));
      row.appendChild(val);
      var meta = document.createElement("span");
      meta.className = "proj-meta";
      meta.textContent =
        (r.language ? r.language + " · " : "") +
        r.stargazers_count +
        "★ · " +
        (r.fork ? "fork" : "source");
      row.appendChild(meta);
      repos.appendChild(row);

      if (r.description) {
        var d = document.createElement("div");
        d.className = "proj-desc";
        d.textContent = r.description;
        repos.appendChild(d);
      }
    });
  }

  function showError() {
    hint.innerHTML = "";
    var text = document.createTextNode("Couldn't load repos. ");
    hint.appendChild(text);
    var a = document.createElement("a");
    a.href = "https://github.com/" + GH_USER;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = "See them on GitHub →";
    hint.appendChild(a);
  }

  var controller = window.AbortController ? new AbortController() : null;
  var timeout = controller ? setTimeout(function () {
    controller.abort();
  }, 10000) : null;

  fetch(API, controller ? { signal: controller.signal } : {})
    .then(function (res) {
      if (!res.ok) throw new Error(res.status);
      return res.json();
    })
    .then(render)
    .catch(showError)
    .finally(function () {
      if (timeout) clearTimeout(timeout);
      if (hint && hint.textContent.indexOf("Loading") === 0) {
        hint.textContent = "";
      }
    });
})();
