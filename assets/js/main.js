/* ============================================================
   The Club House — landing page behaviour

   No dependencies, no build step. Three jobs:
     1. Mobile navigation
     2. Safe in-page anchor scrolling
     3. Waitlist submission (Supabase, with an honest fallback)
   ============================================================ */
(function () {
  'use strict';

  var CFG = window.CLUBHOUSE_CONFIG || {};

  /* ── 1. MOBILE NAV ─────────────────────────────────────── */
  var toggle = document.querySelector('.nav-toggle');
  var links = document.getElementById('nav-links');

  if (toggle && links) {
    var setOpen = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      links.classList.toggle('is-open', open);
    };

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    // Close after navigating to a section.
    links.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });

    // Reset when crossing the desktop breakpoint so the menu can
    // never be stuck open behind a desktop layout.
    var mq = window.matchMedia('(min-width: 769px)');
    var onChange = function (e) { if (e.matches) setOpen(false); };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }

  /* ── 2. ANCHOR SCROLLING ───────────────────────────────── */
  /* The previous build passed every href straight into
     querySelector. The nav logo is href="#", and
     document.querySelector('#') throws a DOMException — so
     clicking the logo threw on every single click. Guard the
     selector, and treat a bare "#" as "scroll to top". */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;

    var href = a.getAttribute('href');
    if (!href || href === '#') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    var target;
    try {
      target = document.querySelector(href);
    } catch (err) {
      return; // malformed fragment — let the browser handle it
    }
    if (!target) return;

    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Keep the URL shareable without triggering a second jump.
    if (window.history && history.pushState) history.pushState(null, '', href);
  });

  /* ── 3. SCROLL REVEAL ──────────────────────────────────── */
  /* The class is added by JS, so with JS off or broken the
     content is simply visible rather than stranded at
     opacity:0. Skipped entirely for reduced-motion users. */
  var reveals = document.querySelectorAll('.reveal');
  var wantsMotion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reveals.length && wantsMotion && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('reveal-ready');

    var revealAll = function () {
      reveals.forEach(function (el) { el.classList.add('is-in'); });
    };

    /* Failsafe. Content being visible always beats content being
       animated: a hidden or throttled tab can freeze transitions,
       and anything the observer never reports on would otherwise
       stay at opacity:0 forever. Whatever has not revealed on its
       own by now gets revealed unconditionally. */
    var failsafe = setTimeout(revealAll, 1600);

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

    reveals.forEach(function (el) { io.observe(el); });

    // If the tab is hidden at load, don't animate at all — just show.
    if (document.visibilityState === 'hidden') {
      clearTimeout(failsafe);
      revealAll();
    }
    window.addEventListener('pagehide', revealAll);
  }

  /* ── 4. WAITLIST ───────────────────────────────────────── */
  var hasSupabase = Boolean(CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY);

  if (!hasSupabase) {
    console.warn(
      '[Club House] Supabase is not configured, so the waitlist forms are ' +
      'linking out to Tally instead of capturing on-page. Add SUPABASE_URL ' +
      'and SUPABASE_ANON_KEY in assets/js/config.js to enable real capture.'
    );
  }

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  document.querySelectorAll('form[data-waitlist]').forEach(function (form) {
    var role = form.getAttribute('data-waitlist');
    var card = form.closest('.form-card');
    var done = card.querySelector('.form-done');
    var status = form.querySelector('.form-status');
    var button = form.querySelector('button[type="submit"]');
    var buttonLabel = button.textContent;

    /* Not configured: turn the form into an honest link-out
       rather than collecting data we would then throw away. */
    if (!hasSupabase) {
      var url = (CFG.FALLBACK_FORMS || {})[role];
      if (url) {
        form.setAttribute('data-fallback', 'true');
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          window.open(url, '_blank', 'noopener');
        });
      }
      return;
    }

    var fail = function (msg) {
      status.textContent = msg;
      status.classList.add('is-error');
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      status.textContent = '';
      status.classList.remove('is-error');

      var data = new FormData(form);

      // Honeypot: bots fill hidden fields, humans cannot see them.
      // Pretend success so the bot does not retry.
      if ((data.get('website') || '').trim() !== '') {
        form.hidden = true;
        done.hidden = false;
        return;
      }

      var payload = {
        role: role,
        name: (data.get('name') || '').trim(),
        email: (data.get('email') || '').trim().toLowerCase(),
        organization: (data.get('organization') || '').trim(),
        category: data.get('category') || ''
      };

      if (!payload.name) return fail('Please enter your name.');
      if (!EMAIL_RE.test(payload.email)) return fail('Please enter a valid email address.');
      if (!payload.organization) {
        return fail(role === 'athlete'
          ? 'Please enter your university or college.'
          : 'Please enter your club or organization.');
      }
      if (!payload.category) {
        return fail(role === 'athlete'
          ? 'Please select your primary sport.'
          : 'Please select your club type.');
      }

      button.disabled = true;
      button.textContent = 'Sending…';

      var endpoint = CFG.SUPABASE_URL.replace(/\/+$/, '') +
                     '/rest/v1/' + (CFG.WAITLIST_TABLE || 'waitlist');

      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': CFG.SUPABASE_ANON_KEY,
          'Authorization': 'Bearer ' + CFG.SUPABASE_ANON_KEY,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          if (res.ok) return null;

          // 23505 = unique_violation. Already signed up is a
          // success from the visitor's point of view.
          return res.text().then(function (body) {
            if (res.status === 409 || body.indexOf('23505') !== -1) return null;
            throw new Error('HTTP ' + res.status + ' ' + body);
          });
        })
        .then(function () {
          // Success state is shown ONLY after a confirmed write.
          form.hidden = true;
          done.hidden = false;
          done.setAttribute('tabindex', '-1');
          done.focus({ preventScroll: true });
        })
        .catch(function (err) {
          console.error('[Club House] waitlist submission failed:', err);
          button.disabled = false;
          button.textContent = buttonLabel;
          fail('Something went wrong on our end. Please try again, or email hello@theclubhouse.io and we will add you manually.');
        });
    });
  });
})();
