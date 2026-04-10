/**
 * Supabase auth + data mock — injected by mock-proxy into HTML pages.
 * Makes Supabase-based apps think they're authenticated with mock data.
 * No app code is modified.
 */
(function() {
  'use strict';

  // ── Config ──
  var FAKE_USER_ID = '00000000-0000-0000-0000-000000000001';
  var SUPABASE_REFS = ['gwcuxnlhgquchuimuxrk', 'nnjqkhlkwslsyvdmjqsk', 'yxfljdwsoyrvbvncbyyx'];

  var FAKE_SESSION = {
    access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjo5OTk5OTk5OTk5LCJzdWIiOiIwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDEiLCJlbWFpbCI6ImRlbW9AbWFnaWNicm9vbS5kZXYiLCJyb2xlIjoiYXV0aGVudGljYXRlZCJ9.fake',
    token_type: 'bearer',
    expires_in: 86400,
    expires_at: 9999999999,
    refresh_token: 'fake-refresh-token',
    user: {
      id: FAKE_USER_ID, aud: 'authenticated', role: 'authenticated',
      email: 'demo@magicbroom.dev', email_confirmed_at: '2026-01-01T00:00:00Z',
      app_metadata: { provider: 'email' },
      user_metadata: { display_name: 'Demo Wizard' },
      created_at: '2026-01-01T00:00:00Z'
    }
  };

  var CHANNELS = [
    { id: 'c1', name: 'general', slug: 'general', description: 'General discussion', type: 'standard', is_archived: false, is_private: false, created_by: FAKE_USER_ID, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
    { id: 'c2', name: 'introductions', slug: 'introductions', description: 'Say hello!', type: 'standard', is_archived: false, is_private: false, created_by: FAKE_USER_ID, created_at: '2026-01-02T00:00:00Z', updated_at: '2026-01-02T00:00:00Z' },
    { id: 'c3', name: 'show-and-tell', slug: 'show-and-tell', description: 'Share your projects', type: 'gallery', is_archived: false, is_private: false, created_by: FAKE_USER_ID, created_at: '2026-01-03T00:00:00Z', updated_at: '2026-01-03T00:00:00Z' }
  ];

  var PROFILE = { id: FAKE_USER_ID, display_name: 'Demo Wizard', avatar_url: null, role: 'instructor', email: 'demo@magicbroom.dev', username: 'demowizard', status: 'online', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' };

  var PROFILES = [
    PROFILE,
    { id: 'u2', display_name: 'Luna Starweaver', avatar_url: null, role: 'student', username: 'luna', status: 'online', created_at: '2026-01-01T00:00:00Z' },
    { id: 'u3', display_name: 'Sage Thornberry', avatar_url: null, role: 'student', username: 'sage', status: 'offline', created_at: '2026-01-01T00:00:00Z' }
  ];

  var PROFILE_MAP = {};
  PROFILES.forEach(function(p) { PROFILE_MAP[p.id] = { display_name: p.display_name, avatar_url: p.avatar_url }; });

  var MESSAGES = [
    { id: 'm1', channel_id: 'c1', user_id: 'u2', content: 'Hey everyone! Welcome to Magic Brooms \u2728', created_at: '2026-03-30T10:00:00Z', fts: null },
    { id: 'm2', channel_id: 'c1', user_id: 'u3', content: 'This is so cool \u2014 love the workshop theme!', created_at: '2026-03-30T10:05:00Z', fts: null },
    { id: 'm3', channel_id: 'c1', user_id: FAKE_USER_ID, content: 'Thanks! Built this as a framework comparison for the AI course.', created_at: '2026-03-30T10:10:00Z', fts: null },
    { id: 'm4', channel_id: 'c1', user_id: 'u2', content: 'Which framework ended up winning?', created_at: '2026-03-30T10:12:00Z', fts: null },
    { id: 'm5', channel_id: 'c1', user_id: FAKE_USER_ID, content: 'BMAD \u2014 most real features after source code verification \uD83C\uDFC6', created_at: '2026-03-30T10:15:00Z', fts: null }
  ].map(function(m) { m.profiles = PROFILE_MAP[m.user_id] || { display_name: 'Unknown', avatar_url: null }; return m; });

  var MEMBERS = CHANNELS.map(function(ch) {
    return { channel_id: ch.id, user_id: FAKE_USER_ID, last_read_at: '2026-03-31T00:00:00Z', joined_at: '2026-01-01T00:00:00Z', role: 'member', channels: ch, profiles: PROFILE };
  });

  // ── 1. Inject fake session into localStorage ──
  SUPABASE_REFS.forEach(function(ref) {
    var key = 'sb-' + ref + '-auth-token';
    try { localStorage.setItem(key, JSON.stringify(FAKE_SESSION)); } catch(e) {}
  });

  // ── 2. Stub WebSocket to prevent realtime crashes ──
  var OrigWS = window.WebSocket;
  window.WebSocket = function(url, protocols) {
    if (url && url.indexOf('supabase') !== -1) {
      var mock = {
        readyState: 1, send: function(){}, close: function(){},
        addEventListener: function(e, cb) { if (e === 'open') setTimeout(cb, 10); },
        removeEventListener: function(){},
        onopen: null, onclose: null, onmessage: null, onerror: null,
        CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3,
        url: url, protocol: '', extensions: '', bufferedAmount: 0, binaryType: 'blob'
      };
      setTimeout(function() { if (mock.onopen) mock.onopen({}); }, 10);
      return mock;
    }
    return new OrigWS(url, protocols);
  };
  window.WebSocket.CONNECTING = 0; window.WebSocket.OPEN = 1;
  window.WebSocket.CLOSING = 2; window.WebSocket.CLOSED = 3;

  // ── 3. Intercept fetch() to mock Supabase REST API ──
  var origFetch = window.fetch;
  window.fetch = function(input, init) {
    var url = typeof input === 'string' ? input : (input && input.url ? input.url : '');
    if (url.indexOf('supabase.co') === -1) return origFetch.apply(this, arguments);

    var headers = (init && init.headers) || {};
    var accept = headers['Accept'] || headers['accept'] || '';
    var isSingle = accept.indexOf('vnd.pgrst.object') !== -1;

    // Parse select for join detection
    var selectMatch = url.match(/[?&]select=([^&]*)/);
    var select = selectMatch ? decodeURIComponent(selectMatch[1]) : '';

    function jsonResponse(data) {
      return Promise.resolve(new Response(JSON.stringify(data), {
        status: 200, headers: { 'Content-Type': 'application/json' }
      }));
    }

    // Auth
    if (url.indexOf('/auth/v1/token') !== -1) return jsonResponse(FAKE_SESSION);
    if (url.indexOf('/auth/v1/user') !== -1) return jsonResponse(FAKE_SESSION.user);
    if (url.indexOf('/auth/v1/') !== -1) return jsonResponse({});

    // Channels
    if (url.indexOf('/rest/v1/channels') !== -1) {
      if (isSingle) return jsonResponse(CHANNELS[0]);
      return jsonResponse(CHANNELS);
    }

    // Messages
    if (url.indexOf('/rest/v1/messages') !== -1) {
      if (isSingle) return jsonResponse(MESSAGES[0]);
      return jsonResponse(MESSAGES);
    }

    // Channel members (with optional joins)
    if (url.indexOf('/rest/v1/channel_members') !== -1) {
      return jsonResponse(MEMBERS);
    }

    // Profiles
    if (url.indexOf('/rest/v1/profiles') !== -1) {
      if (isSingle) return jsonResponse(PROFILE);
      return jsonResponse(PROFILES);
    }

    // RPC
    if (url.indexOf('/rest/v1/rpc/') !== -1) return jsonResponse([]);

    // Gallery, reactions, etc.
    if (url.indexOf('/rest/v1/') !== -1) return jsonResponse([]);

    // Storage
    if (url.indexOf('/storage/') !== -1) return jsonResponse({});

    return origFetch.apply(this, arguments);
  };
})();
