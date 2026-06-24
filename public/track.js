/*!
 * Sada Analytics Tracker  v1.0.0
 * Lightweight (~6KB) framework-agnostic vanilla JS tracker.
 * Embed once via <script async src=".../track.js"></script> and it auto-tracks
 * pageviews, SPA route changes, heartbeats, leaves, and clicks (data-sada-track).
 * Public API: window.sada.track(name, props?), sada.page(path?), sada.setVisitor(props)
 *
 * Released for the Sada Al-Aqar analytics dashboard.
 */
(function () {
  'use strict';

  // ===== Guard against double-init =====
  if (window.sada && window.sada.__init === true) return;

  // ===== Config (read from window.sadaConfig set BEFORE this script) =====
  var cfg = window.sadaConfig || (window.sadaConfig = {});
  var debug = !!cfg.debug;
  var autoPageviews = cfg.autoPageviews !== false; // default true
  var autoClicks = cfg.autoClicks !== false; // default true
  var disabled = !!cfg.disabled;
  var hbInterval = (cfg.heartbeatIntervalMs | 0) || 10000;

  // ===== Endpoint resolution =====
  var endpoint = cfg.endpoint;
  if (!endpoint) {
    try {
      var cur = document.currentScript;
      var src = cur && cur.src ? cur.src : '';
      if (src) {
        var base = src.split('#')[0].split('?')[0];
        var dir = base.slice(0, base.lastIndexOf('/')) + '/';
        endpoint = dir + 'api/track';
      }
    } catch (e) {}
  }
  if (!endpoint) endpoint = '/api/track';

  // ===== IDs (visitor = persistent, session = per-tab) =====
  var VISITOR_KEY = 'sada_visitor_id';
  var SESSION_KEY = 'sada_session_id';

  function uuid() {
    try {
      if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    } catch (e) {}
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function lsGet(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function lsSet(key, val) {
    try { localStorage.setItem(key, val); } catch (e) {}
  }
  function ssGet(key) {
    try { return sessionStorage.getItem(key); } catch (e) { return null; }
  }
  function ssSet(key, val) {
    try { sessionStorage.setItem(key, val); } catch (e) {}
  }

  function getVisitorId() {
    var v = lsGet(VISITOR_KEY);
    if (v) return v;
    v = uuid();
    lsSet(VISITOR_KEY, v);
    return v;
  }
  function getSessionId() {
    var s = ssGet(SESSION_KEY);
    if (s) return s;
    s = uuid();
    ssSet(SESSION_KEY, s);
    return s;
  }

  var visitorId = getVisitorId();
  var sessionId = getSessionId();
  var visitorProps = {};

  function log() {
    if (debug && window.console) {
      var a = Array.prototype.slice.call(arguments);
      a.unshift('[sada]');
      console.log.apply(console, a);
    }
  }

  // ===== Payload + network =====
  function buildPayload(type, extra) {
    var p = {
      type: type,
      sessionId: sessionId,
      visitorId: visitorId,
      url: location.href,
      referrer: document.referrer || null,
      title: document.title || null,
      screenWidth: window.screen ? window.screen.width : null,
      screenHeight: window.screen ? window.screen.height : null,
      language: navigator.language || null,
    };
    // Merge persistent visitor props (if any) into metadata
    var hasVP = false;
    for (var k in visitorProps) { hasVP = true; break; }
    if (hasVP) p.metadata = Object.assign({}, visitorProps);
    if (extra) for (var j in extra) p[j] = extra[j];
    return p;
  }

  function send(payload, useBeacon) {
    try {
      var body = JSON.stringify(payload);
      if (useBeacon && navigator.sendBeacon) {
        var blob;
        try { blob = new Blob([body], { type: 'application/json' }); }
        catch (e) { blob = null; }
        if (blob) {
          var ok = navigator.sendBeacon(endpoint, blob);
          if (ok) { log('sent (beacon)', payload.type); return; }
        }
      }
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body,
        keepalive: true,
        credentials: 'include',
        mode: 'cors',
      }).then(
        function () { log('sent', payload.type); },
        function (err) { log('send error', err); }
      );
    } catch (e) {
      log('send exception', e);
    }
  }

  // ===== Event senders =====
  function trackPageView(path) {
    var extra = {};
    if (path) {
      try { extra.url = new URL(path, location.href).href; }
      catch (e) { extra.url = String(path); }
    }
    send(buildPayload('pageview', extra), false);
  }

  function trackEvent(name, props) {
    if (!name || typeof name !== 'string') return;
    var extra = { name: name, category: null, label: null, value: null, metadata: null };
    if (props) {
      if (props.category !== undefined) extra.category = props.category;
      if (props.label !== undefined) extra.label = props.label;
      if (props.value !== undefined) extra.value = props.value;
      if (props.metadata !== undefined) extra.metadata = props.metadata;
      var metaKeys = {};
      var hasMeta = false;
      for (var k in props) {
        if (k !== 'category' && k !== 'label' && k !== 'value' && k !== 'metadata') {
          metaKeys[k] = props[k];
          hasMeta = true;
        }
      }
      if (hasMeta && extra.metadata == null) extra.metadata = metaKeys;
    }
    send(buildPayload('event', extra), false);
  }

  function trackHeartbeat() { send(buildPayload('heartbeat'), false); }
  function trackLeave() { send(buildPayload('leave'), true); }

  // ===== SPA route hook (pushState / replaceState / popstate) =====
  function patchHistory() {
    if (!autoPageviews) return;
    var origPush = history.pushState;
    var origReplace = history.replaceState;
    var fire = function () {
      setTimeout(function () { try { trackPageView(); } catch (e) {} }, 0);
    };
    history.pushState = function () {
      var r = origPush.apply(this, arguments);
      try { fire(); } catch (e) {}
      return r;
    };
    history.replaceState = function () {
      var r = origReplace.apply(this, arguments);
      try { fire(); } catch (e) {}
      return r;
    };
    window.addEventListener('popstate', function () {
      try { trackPageView(); } catch (e) {}
    });
  }

  // ===== Click tracking (data-sada-track) =====
  function setupClickTracking() {
    if (!autoClicks) return;
    document.addEventListener('click', function (e) {
      try {
        var node = e.target;
        while (node && node !== document) {
          if (node.nodeType === 1 && node.hasAttribute && node.hasAttribute('data-sada-track')) {
            var name = node.getAttribute('data-sada-track') || 'click';
            var label = (node.textContent || '').trim().slice(0, 200);
            var category = node.getAttribute('data-sada-category') || null;
            trackEvent(name, { label: label, category: category });
            break;
          }
          node = node.parentNode;
        }
      } catch (err) {}
    }, true);
  }

  // ===== Heartbeat =====
  function setupHeartbeat() {
    setInterval(function () { try { trackHeartbeat(); } catch (e) {} }, hbInterval);
    document.addEventListener('visibilitychange', function () {
      try { if (document.visibilityState === 'visible') trackHeartbeat(); } catch (e) {}
    });
  }

  // ===== Leave detection =====
  function setupLeave() {
    var fired = false;
    function onLeave() {
      if (fired) return;
      fired = true;
      try { trackLeave(); } catch (e) {}
      // allow re-firing if the user comes back (pagehide can fire without unload)
      setTimeout(function () { fired = false; }, 2000);
    }
    window.addEventListener('pagehide', onLeave);
    window.addEventListener('beforeunload', onLeave);
  }

  // ===== Public API =====
  var api = {
    __init: true,
    version: '1.0.0',
    endpoint: endpoint,
    visitorId: visitorId,
    sessionId: sessionId,
    track: function (name, props) {
      try { trackEvent(name, props); } catch (e) { log('track err', e); }
      return api;
    },
    page: function (path) {
      try { trackPageView(path); } catch (e) { log('page err', e); }
      return api;
    },
    setVisitor: function (props) {
      try {
        if (props && typeof props === 'object') {
          for (var k in props) {
            if (Object.prototype.hasOwnProperty.call(props, k)) visitorProps[k] = props[k];
          }
        }
      } catch (e) {}
      return api;
    },
    config: function (key, value) {
      try { if (key) cfg[key] = value; } catch (e) {}
      return cfg;
    },
  };

  // ===== Replay queued calls (window.sada.queue) =====
  var queue = null;
  if (window.sada && Array.isArray(window.sada.queue)) queue = window.sada.queue;
  window.sada = api;
  if (queue) {
    for (var i = 0; i < queue.length; i++) {
      try {
        var item = queue[i];
        if (item && item[0] && typeof api[item[0]] === 'function') {
          api[item[0]].apply(api, item.slice(1));
        }
      } catch (e) {}
    }
  }

  // ===== Boot =====
  if (disabled) {
    log('disabled — skipping init');
    return;
  }
  try {
    if (autoPageviews) trackPageView();
    patchHistory();
    setupClickTracking();
    setupHeartbeat();
    setupLeave();
    log('init', { endpoint: endpoint, visitorId: visitorId, sessionId: sessionId });
  } catch (e) {
    log('init error', e);
  }
})();
