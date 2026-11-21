(function () {
  "use strict";

  /* ---------- interactive background (canvas + web audio) ---------- */
  (function () {
    var canvas = document.getElementById("bg-canvas");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var container = document.querySelector(".container");
    var particles = [];
    var dpr = window.devicePixelRatio || 1;
    var W, H;
    var raf;
    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var PALETTE = [
      "#7aa2f7", "#bb9af7", "#9ece6a", "#e0af68",
      "#f7768e", "#73daca", "#ff9e64", "#7dcfff"
    ];

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    function rand(a, b) { return Math.random() * (b - a) + a; }
    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    function spawn(x, y, type) {
      var color = pick(PALETTE);
      var baseSize = Math.min(W, H) * 0.06;
      if (type === "circle") {
        particles.push({
          x: x, y: y, r: 0,
          maxR: rand(baseSize * 0.4, baseSize * 1.2),
          color: color, alpha: 0.7,
          vx: rand(-1, 1), vy: rand(-1, 1),
          life: 1, decay: rand(0.012, 0.025),
          shape: "circle"
        });
      } else if (type === "square") {
        var s = rand(baseSize * 0.3, baseSize * 0.8);
        particles.push({
          x: x, y: y, s: 0, maxS: s,
          rot: rand(0, Math.PI * 2),
          color: color, alpha: 0.6,
          vx: rand(-1.5, 1.5), vy: rand(-1.5, 1.5),
          life: 1, decay: rand(0.01, 0.02),
          shape: "square"
        });
      } else if (type === "ring") {
        particles.push({
          x: x, y: y, r: 0,
          maxR: rand(baseSize * 0.8, baseSize * 1.8),
          color: color, alpha: 0.5,
          life: 1, decay: rand(0.015, 0.03),
          shape: "ring"
        });
      } else if (type === "line") {
        var angle = rand(0, Math.PI * 2);
        var len = rand(baseSize * 0.5, baseSize * 1.5);
        particles.push({
          x: x, y: y,
          ex: x + Math.cos(angle) * len,
          ey: y + Math.sin(angle) * len,
          color: color, alpha: 0.6,
          life: 1, decay: rand(0.015, 0.03),
          shape: "line"
        });
      }
    }

    var audioCtx = null;
    function beep(freq, dur) {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === "suspended") audioCtx.resume();
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + dur);
    }

    var NOTES = [261, 293, 329, 349, 392, 440, 493, 523, 587, 659, 698, 784];

    function trigger(x, y) {
      if (reducedMotion) return;
      var shapes = ["circle", "square", "ring", "line"];
      var count = Math.floor(rand(2, 5));
      for (var i = 0; i < count; i++) {
        spawn(x + rand(-20, 20), y + rand(-20, 20), pick(shapes));
      }
      beep(pick(NOTES), rand(0.15, 0.35));
    }

    function isInContent(el) {
      while (el) {
        if (el === container) return true;
        el = el.parentElement;
      }
      return false;
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (var i = particles.length - 1; i >= 0; i--) {
        var p = particles[i];
        p.life -= p.decay;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        p.x += p.vx || 0;
        p.y += p.vy || 0;
        ctx.globalAlpha = p.alpha * p.life;
        ctx.fillStyle = p.color;
        ctx.strokeStyle = p.color;

        if (p.shape === "circle") {
          p.r += (p.maxR - p.r) * 0.12;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === "square") {
          p.s += (p.maxS - p.s) * 0.12;
          p.rot += 0.02;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s);
          ctx.restore();
        } else if (p.shape === "ring") {
          p.r += (p.maxR - p.r) * 0.08;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.stroke();
        } else if (p.shape === "line") {
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.ex, p.ey);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    }

    document.addEventListener("mousedown", function (e) {
      if (isInContent(e.target)) return;
      trigger(e.clientX, e.clientY);
    });
    document.addEventListener("touchstart", function (e) {
      if (isInContent(e.target)) return;
      for (var i = 0; i < e.touches.length; i++) {
        trigger(e.touches[i].clientX, e.touches[i].clientY);
      }
    }, { passive: true });

    if (!reducedMotion) draw();
  })();

  /* ---------- music generator (web audio api) ---------- */
  (function () {
    var btn = document.getElementById("music-toggle");
    var label = document.getElementById("music-label");
    if (!btn) return;

    var current = localStorage.getItem("voidm-music") || "";
    var audioCtx = null;
    var playing = false;
    var nodes = [];
    var timers = [];
    var gainNode = null;

    function initCtx() {
      if (audioCtx) return;
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      gainNode = audioCtx.createGain();
      gainNode.gain.value = 0.7;
      gainNode.connect(audioCtx.destination);
    }

    function stopAll() {
      nodes.forEach(function (n) { try { n.stop(); } catch (e) {} });
      timers.forEach(function (t) { clearTimeout(t); clearInterval(t); });
      nodes = [];
      timers = [];
      playing = false;
    }

    function playChiptune() {
      initCtx();
      var scale = [261, 293, 329, 349, 392, 440, 493, 523, 587, 659];
      var step = 60 / 140 / 2;
      var seq = [0,4,7,12,7,4,0,12,9,5,12,9,5,0,7,4];
      var i = 0;

      function note() {
        if (!playing) return;
        var freq = scale[seq[i % seq.length] % scale.length];
        var osc = audioCtx.createOscillator();
        var g = audioCtx.createGain();
        osc.type = "square";
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0.2, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + step * 0.9);
        osc.connect(g);
        g.connect(gainNode);
        osc.start();
        osc.stop(audioCtx.currentTime + step);
        nodes.push(osc);
        i++;
      }
      note();
      timers.push(setInterval(note, step * 1000));
    }

    function start() {
      stopAll();
      playing = true;
      playChiptune();
      label.textContent = "chiptune";
      btn.classList.add("active");
    }

    function stop() {
      stopAll();
      label.textContent = "";
      btn.classList.remove("active");
      current = "";
      localStorage.removeItem("voidm-music");
    }

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (playing) {
        stop();
      } else {
        current = "chiptune";
        localStorage.setItem("voidm-music", current);
        start();
      }
    });

    if (current === "chiptune") start();
  })();

  /* ---------- theme: follow system + manual override ---------- */
  var root = document.documentElement;
  var stored = localStorage.getItem("voidm-theme");

  function applyTheme() {
    root.setAttribute("data-theme",
      stored === "light" || stored === "dark" ? stored : "auto"
    );
  }
  applyTheme();

  var themeToggle = document.getElementById("theme-toggle");
  var meta = document.querySelector('meta[name="theme-color"]');

  function syncMeta() {
    var theme = root.getAttribute("data-theme");
    var isDark = theme === "dark" || (theme === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);
    if (meta) meta.setAttribute("content", isDark ? "#0b0d10" : "#ffffff");
  }

  themeToggle.addEventListener("click", function () {
    var cur = root.getAttribute("data-theme");
    if (cur === "auto") {
      var resolved = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      stored = resolved === "dark" ? "light" : "dark";
    } else {
      stored = cur === "dark" ? "light" : "dark";
    }
    root.setAttribute("data-theme", stored);
    localStorage.setItem("voidm-theme", stored);
    syncMeta();
  });

  matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", function () {
      if (root.getAttribute("data-theme") === "auto") syncMeta();
    });
  syncMeta();

  /* ---------- footer year ---------- */
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- articles (from data/articles.json) ---------- */
  var articleList = document.getElementById("articles-list");
  if (articleList) {
    fetch("data/articles.json")
      .then(function (res) { return res.json(); })
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
              live.textContent = "\u2197";
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
      .catch(function () {}); // silent fail — article list is non-critical
  }

  /* ---------- GitHub repos (static snapshot: data/repos.json) ---------- */
  var repos = document.getElementById("repos");
  var hint = document.querySelector("#projects .hint");
  var API = "data/repos.json";
  var PAGE_SIZE = 10;
  var currentPage = 1;
  var allRepos = [];

  var paginationWrap = document.createElement("div");
  paginationWrap.className = "pagination";

  var prevBtn = document.createElement("button");
  prevBtn.textContent = "\u2190 prev";
  prevBtn.className = "page-btn";
  prevBtn.addEventListener("click", function () {
    if (currentPage > 1) { currentPage--; renderPage(); }
  });

  var pageInfo = document.createElement("span");
  pageInfo.className = "page-info";

  var nextBtn = document.createElement("button");
  nextBtn.textContent = "next \u2192";
  nextBtn.className = "page-btn";
  nextBtn.addEventListener("click", function () {
    var totalPages = Math.ceil(allRepos.length / PAGE_SIZE);
    if (currentPage < totalPages) { currentPage++; renderPage(); }
  });

  paginationWrap.appendChild(prevBtn);
  paginationWrap.appendChild(pageInfo);
  paginationWrap.appendChild(nextBtn);

  function renderPage() {
    repos.innerHTML = "";
    var start = (currentPage - 1) * PAGE_SIZE;
    var slice = allRepos.slice(start, start + PAGE_SIZE);

    slice.forEach(function (r) {
      var row = document.createElement("div");
      row.className = "item";
      var val = document.createElement("span");
      val.className = "val";
      var a = document.createElement("a");
      a.href = r.html_url;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = r.name;
      val.appendChild(a);
      row.appendChild(val);
      var meta = document.createElement("span");
      meta.className = "proj-meta";
      meta.textContent =
        (r.language ? r.language + " \u00b7 " : "") +
        r.stargazers_count + "\u2605 \u00b7 " +
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

    var totalPages = Math.ceil(allRepos.length / PAGE_SIZE);
    pageInfo.textContent = currentPage + " / " + totalPages;
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;

    if (allRepos.length > PAGE_SIZE) {
      repos.parentNode.insertBefore(paginationWrap, repos.nextSibling);
    }
  }

  function render(list) {
    if (!list.length) {
      repos.innerHTML = '<div class="item"><span class="val">No public repos.</span></div>';
      return;
    }
    list.sort(function (a, b) {
      return (b.stargazers_count || 0) - (a.stargazers_count || 0);
    });
    allRepos = list;
    currentPage = 1;
    renderPage();
  }

  function showError() {
    hint.appendChild(document.createTextNode(" Couldn't load repos. "));
    var a = document.createElement("a");
    a.href = "https://t.me/dylib_dobby_hook_chat";
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = "Find me on Telegram \u2192";
    hint.appendChild(a);
  }

  var controller = window.AbortController ? new AbortController() : null;
  var timeout = controller ? setTimeout(function () { controller.abort(); }, 10000) : null;

  fetch(API, controller ? { signal: controller.signal } : {})
    .then(function (res) { if (!res.ok) throw new Error(res.status); return res.json(); })
    .then(render)
    .catch(showError)
    .finally(function () {
      if (timeout) clearTimeout(timeout);
    });
})();
