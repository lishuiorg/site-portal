/* 溧水知识门户 · 界面脚本
   三件事：明暗主题切换、站内查找（筛选站点与专题）、滚动入场。
   语言切换是纯链接，不在此处理——中文在 /，英文在 /en/。 */

(function () {
  'use strict';

  var STORE_KEY = 'lishui-theme';
  var root = document.documentElement;

  /* ---------- 明暗主题 ---------- */

  function currentTheme() {
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function applyTheme(theme, persist) {
    root.setAttribute('data-theme', theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0C1211' : '#F6F4EE');
    if (persist) {
      try { localStorage.setItem(STORE_KEY, theme); } catch (e) { /* 隐私模式下忽略 */ }
    }
    var btn = document.querySelector('[data-theme-toggle]');
    if (btn) {
      btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
      btn.setAttribute('aria-label',
        theme === 'dark' ? btn.getAttribute('data-label-light') : btn.getAttribute('data-label-dark'));
    }
  }

  var toggle = document.querySelector('[data-theme-toggle]');
  if (toggle) {
    toggle.addEventListener('click', function () {
      applyTheme(currentTheme() === 'dark' ? 'light' : 'dark', true);
    });
    applyTheme(currentTheme(), false);
  }

  // 用户未手动选择时，跟随系统变化
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var onSystemChange = function (e) {
      var saved = null;
      try { saved = localStorage.getItem(STORE_KEY); } catch (err) { /* 忽略 */ }
      if (!saved) applyTheme(e.matches ? 'dark' : 'light', false);
    };
    if (mq.addEventListener) mq.addEventListener('change', onSystemChange);
    else if (mq.addListener) mq.addListener(onSystemChange);
  }

  /* ---------- 站内查找 ---------- */

  var input = document.querySelector('[data-search-input]');
  var form = document.querySelector('[data-search-form]');

  var filterbars = Array.prototype.slice.call(document.querySelectorAll('[data-filterbar]'));
  var filtertexts = Array.prototype.slice.call(document.querySelectorAll('[data-filtertext]'));
  var clearBtns = Array.prototype.slice.call(document.querySelectorAll('[data-filter-clear]'));
  var noresults = Array.prototype.slice.call(document.querySelectorAll('[data-noresult]'));

  var cards = Array.prototype.slice.call(document.querySelectorAll('[data-searchable]'));
  var groups = Array.prototype.slice.call(document.querySelectorAll('[data-search-group]'));

  function normalize(s) {
    return (s || '').toLowerCase().replace(/\s+/g, '');
  }

  function applyFilter(raw) {
    var q = normalize(raw);
    var hits = 0;

    cards.forEach(function (card) {
      var text = normalize(card.getAttribute('data-search-text') || card.textContent);
      var hit = !q || text.indexOf(q) !== -1;
      card.hidden = !hit;
      if (hit) hits++;
    });

    groups.forEach(function (group) {
      var visible = group.querySelectorAll('[data-searchable]:not([hidden])').length;
      group.hidden = visible === 0;
    });

    filterbars.forEach(function (bar) {
      bar.setAttribute('data-visible', q ? 'true' : 'false');
    });
    filtertexts.forEach(function (el) {
      el.textContent = q ? raw.trim() + '　·　' + hits : '';
    });
    noresults.forEach(function (el) {
      el.setAttribute('data-visible', q && hits === 0 ? 'true' : 'false');
    });
  }

  if (input) {
    input.addEventListener('input', function () { applyFilter(input.value); });
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      applyFilter(input ? input.value : '');
      var target = document.querySelector('#sites');
      if (target) target.scrollIntoView({ block: 'start' });
    });
  }

  clearBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (input) { input.value = ''; input.focus(); }
      applyFilter('');
    });
  });

  /* ---------- 滚动入场 ---------- */

  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });

    reveals.forEach(function (el, i) {
      el.style.transitionDelay = (Math.min(i % 6, 5) * 55) + 'ms';
      io.observe(el);
    });
  }

  /* ---------- 阅读进度 ---------- */

  var bar = document.querySelector('[data-progress]');
  if (bar) {
    var ticking = false;

    var paint = function () {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var y = window.pageYOffset || doc.scrollTop || 0;
      var ratio = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
      bar.style.width = (ratio * 100).toFixed(2) + '%';
      ticking = false;
    };

    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(paint);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    paint();
  }

  /* ---------- 语言切换：带着当前位置过去 ---------- */

  var langLinks = Array.prototype.slice.call(document.querySelectorAll('[data-lang-switch]'));
  if (langLinks.length) {
    var syncHash = function () {
      var hash = window.location.hash;
      langLinks.forEach(function (a) {
        var base = a.getAttribute('href').split('#')[0];
        a.setAttribute('href', hash ? base + hash : base);
      });
    };
    syncHash();
    window.addEventListener('hashchange', syncHash);
  }

  /* ---------- 页脚年份 ---------- */

  var year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());
})();
