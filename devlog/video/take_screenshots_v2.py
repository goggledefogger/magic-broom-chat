#!/usr/bin/env python3
"""
Take screenshots of Vanilla (Express/SQLite) and Superpowers (with realtime stub).
"""

import json
import re
from pathlib import Path
from playwright.sync_api import sync_playwright

SCREENSHOT_DIR = Path(__file__).parent / "screenshots"
SCREENSHOT_DIR.mkdir(exist_ok=True)

FAKE_USER_ID = "00000000-0000-0000-0000-000000000001"


def screenshot_vanilla(browser):
    """Vanilla uses Express + SQLite. Register a user, create a channel, send messages, screenshot."""
    print("  Setting up vanilla...")
    context = browser.new_context(viewport={"width": 1920, "height": 1080})
    page = context.new_page()

    try:
        # Register a test user via the API
        page.goto("http://localhost:5105/register", wait_until="networkidle", timeout=8000)
        page.wait_for_timeout(1000)

        # Fill registration form
        page.fill('input[name="username"], input[placeholder*="username" i], input:nth-of-type(1)', "demowizard")
        # Find all inputs and fill them
        inputs = page.locator("input").all()
        if len(inputs) >= 3:
            inputs[0].fill("demowizard")
            inputs[1].fill("Demo Wizard")
            inputs[2].fill("password123")
        elif len(inputs) >= 2:
            inputs[0].fill("demowizard")
            inputs[1].fill("password123")

        # Submit
        page.locator('button[type="submit"], button:has-text("Register"), button:has-text("Sign")').first.click()
        page.wait_for_timeout(2000)

        # If registration fails (user exists), try login
        if "/register" in page.url or "error" in page.content().lower():
            print("    Registration may have failed, trying login...")
            page.goto("http://localhost:5105/login", wait_until="networkidle", timeout=8000)
            page.wait_for_timeout(1000)
            inputs = page.locator("input").all()
            if len(inputs) >= 2:
                inputs[0].fill("demowizard")
                inputs[1].fill("password123")
            page.locator('button[type="submit"], button:has-text("Log"), button:has-text("Sign")').first.click()
            page.wait_for_timeout(2000)

        # Now we should be on the chat page
        # Create a channel if needed via API
        import requests
        cookies = {}
        for c in context.cookies():
            cookies[c["name"]] = c["value"]

        session = requests.Session()
        for name, value in cookies.items():
            session.cookies.set(name, value, domain="localhost")

        # Try to create channels and messages
        headers = {"Content-Type": "application/json"}
        for ch_name in ["general", "introductions", "help"]:
            session.post("http://localhost:3001/api/channels",
                        json={"name": ch_name, "description": f"#{ch_name}"},
                        headers=headers)

        # Get channels
        resp = session.get("http://localhost:3001/api/channels")
        channels = resp.json() if resp.ok else []
        if channels:
            ch_id = channels[0]["id"]
            # Send some messages
            messages = [
                "Hey everyone! Welcome to Magic Brooms ✨",
                "This is the Vanilla build — Express + Socket.io + SQLite",
                "No framework overhead. Just pure vibes 🧹",
            ]
            for msg in messages:
                session.post(f"http://localhost:3001/api/channels/{ch_id}/messages",
                            json={"content": msg}, headers=headers)

        # Reload to see messages
        page.reload(wait_until="networkidle", timeout=8000)
        page.wait_for_timeout(2000)

        # Click first channel if visible
        try:
            channel_link = page.locator('a[href*="/channels/"], button:has-text("general"), text=general').first
            if channel_link.is_visible(timeout=2000):
                channel_link.click()
                page.wait_for_timeout(2000)
        except Exception:
            pass

        page.screenshot(path=str(SCREENSHOT_DIR / "vanilla.png"))
        print(f"  vanilla: saved (url: {page.url})")
    except Exception as e:
        print(f"  vanilla: ERROR - {e}")
    finally:
        context.close()


def screenshot_superpowers(browser):
    """Superpowers crashes because realtime WebSockets fail.
    Fix: inject a script that stubs supabase.channel() before the app boots."""
    print("  Setting up superpowers...")
    context = browser.new_context(viewport={"width": 1920, "height": 1080})
    page = context.new_page()

    FAKE_SESSION = {
        "access_token": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDEiLCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImV4cCI6OTk5OTk5OTk5OX0.fake",
        "token_type": "bearer",
        "expires_in": 86400,
        "expires_at": 9999999999,
        "refresh_token": "fake",
        "user": {
            "id": FAKE_USER_ID,
            "aud": "authenticated",
            "role": "authenticated",
            "email": "demo@magicbroom.dev",
            "email_confirmed_at": "2026-01-01T00:00:00Z",
            "app_metadata": {"provider": "email"},
            "user_metadata": {"display_name": "Demo Wizard"},
            "created_at": "2026-01-01T00:00:00Z",
        },
    }

    CHANNELS = [
        {"id": "c1", "name": "general", "slug": "general", "description": "General discussion", "type": "standard", "is_archived": False, "is_private": False, "created_by": FAKE_USER_ID, "created_at": "2026-01-01T00:00:00Z", "updated_at": "2026-01-01T00:00:00Z"},
        {"id": "c2", "name": "introductions", "slug": "introductions", "description": "Say hello!", "type": "standard", "is_archived": False, "is_private": False, "created_by": FAKE_USER_ID, "created_at": "2026-01-02T00:00:00Z", "updated_at": "2026-01-02T00:00:00Z"},
        {"id": "c3", "name": "help", "slug": "help", "description": "Ask for help", "type": "standard", "is_archived": False, "is_private": False, "created_by": FAKE_USER_ID, "created_at": "2026-01-03T00:00:00Z", "updated_at": "2026-01-03T00:00:00Z"},
    ]

    MESSAGES = [
        {"id": "m1", "channel_id": "c1", "user_id": "u2", "content": "Hey everyone! Welcome to Magic Brooms ✨", "created_at": "2026-03-30T10:00:00Z"},
        {"id": "m2", "channel_id": "c1", "user_id": "u3", "content": "This is so cool — love the workshop theme!", "created_at": "2026-03-30T10:05:00Z"},
        {"id": "m3", "channel_id": "c1", "user_id": FAKE_USER_ID, "content": "Thanks! Built this as a framework comparison for the AI course.", "created_at": "2026-03-30T10:10:00Z"},
        {"id": "m4", "channel_id": "c1", "user_id": "u2", "content": "Which framework ended up winning?", "created_at": "2026-03-30T10:12:00Z"},
        {"id": "m5", "channel_id": "c1", "user_id": FAKE_USER_ID, "content": "BMAD — most real features after source code verification 🏆", "created_at": "2026-03-30T10:15:00Z"},
    ]

    PROFILE = {"id": FAKE_USER_ID, "display_name": "Demo Wizard", "username": "demowizard", "avatar_url": None, "status": "online", "created_at": "2026-01-01T00:00:00Z"}
    ALL_PROFILES = [
        PROFILE,
        {"id": "u2", "display_name": "Luna Starweaver", "username": "luna", "avatar_url": None, "status": "online", "created_at": "2026-01-01T00:00:00Z"},
        {"id": "u3", "display_name": "Sage Thornberry", "username": "sage", "avatar_url": None, "status": "offline", "created_at": "2026-01-01T00:00:00Z"},
    ]

    MEMBERS = [{"channel_id": ch["id"], "user_id": FAKE_USER_ID, "last_read_at": "2026-03-31T00:00:00Z", "joined_at": "2026-01-01T00:00:00Z", "role": "member"} for ch in CHANNELS]

    def handle_route(route):
        url = route.request.url
        headers = route.request.headers

        # Auth
        if "/auth/v1/" in url:
            if "/token" in url:
                return route.fulfill(status=200, content_type="application/json", body=json.dumps(FAKE_SESSION))
            if "/user" in url:
                return route.fulfill(status=200, content_type="application/json", body=json.dumps(FAKE_SESSION["user"]))
            return route.fulfill(status=200, content_type="application/json", body=json.dumps({}))

        # Realtime — let it through (we'll stub at JS level)
        if "/realtime/" in url:
            return route.fulfill(status=200, content_type="application/json", body="{}")

        if "/rest/v1/" not in url:
            return route.continue_()

        path_match = re.search(r"/rest/v1/([^?]+)", url)
        table = path_match.group(1) if path_match else ""
        select = ""
        if "?" in url:
            for part in url.split("?")[1].split("&"):
                if part.startswith("select="):
                    select = part[7:]
        accept = headers.get("accept", "")
        is_single = "vnd.pgrst.object" in accept

        if "channels" in table:
            if is_single:
                return route.fulfill(status=200, content_type="application/json", body=json.dumps(CHANNELS[0]))
            return route.fulfill(status=200, content_type="application/json", body=json.dumps(CHANNELS))

        if "messages" in table:
            if is_single:
                return route.fulfill(status=200, content_type="application/json", body=json.dumps(MESSAGES[0]))
            return route.fulfill(status=200, content_type="application/json", body=json.dumps(MESSAGES))

        if "channel_members" in table:
            enriched = MEMBERS
            if "channels" in select:
                enriched = [{**m, "channels": next((c for c in CHANNELS if c["id"] == m["channel_id"]), None)} for m in MEMBERS]
            if "profiles" in select:
                enriched = [{**m, "profiles": PROFILE} for m in enriched]
            return route.fulfill(status=200, content_type="application/json", body=json.dumps(enriched))

        if "profiles" in table:
            if is_single:
                return route.fulfill(status=200, content_type="application/json", body=json.dumps(PROFILE))
            return route.fulfill(status=200, content_type="application/json", body=json.dumps(ALL_PROFILES))

        return route.fulfill(status=200, content_type="application/json", body=json.dumps([]))

    try:
        page.route("**supabase.co/**", handle_route)

        # Inject script BEFORE app loads to stub supabase.channel()
        # This prevents the WebSocket crash in usePresence/useConnectionStatus
        page.add_init_script("""
            // Stub Supabase Realtime to prevent WebSocket crashes
            const _origFetch = window.fetch;
            const _channelStub = {
                on: function() { return this; },
                subscribe: function(cb) { if (cb) setTimeout(() => cb('SUBSCRIBED'), 100); return this; },
                unsubscribe: function() { return this; },
                track: function() { return Promise.resolve(); },
                presenceState: function() { return {}; },
                send: function() { return Promise.resolve(); },
            };

            // Monkey-patch after Supabase client is created
            let _patched = false;
            const _origDefineProperty = Object.defineProperty;

            // Intercept module-level supabase creation
            window.__channelStub = _channelStub;

            // Override at prototype level once createClient runs
            const _interval = setInterval(() => {
                // Find any supabase client and patch its channel method
                if (window.__SUPABASE_PATCHED) { clearInterval(_interval); return; }
                try {
                    // The supabase client is typically stored somewhere accessible
                    // We'll patch the RealtimeClient prototype
                    const frames = document.querySelectorAll('script[type="module"]');
                    // Alternative: just override on any object that has a .channel method
                } catch(e) {}
            }, 50);

            // Cleaner approach: intercept WebSocket constructor
            const OrigWebSocket = window.WebSocket;
            window.WebSocket = function(url, protocols) {
                if (url && url.includes('supabase')) {
                    // Return a mock WebSocket that does nothing
                    const mock = {
                        readyState: 1, // OPEN
                        send: function() {},
                        close: function() {},
                        addEventListener: function(event, cb) {
                            if (event === 'open') setTimeout(cb, 10);
                        },
                        removeEventListener: function() {},
                        onopen: null,
                        onclose: null,
                        onmessage: null,
                        onerror: null,
                        CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3,
                        url: url,
                        protocol: '',
                        extensions: '',
                        bufferedAmount: 0,
                        binaryType: 'blob',
                    };
                    // Fire onopen
                    setTimeout(() => { if (mock.onopen) mock.onopen({}); }, 10);
                    return mock;
                }
                return new OrigWebSocket(url, protocols);
            };
            window.WebSocket.CONNECTING = 0;
            window.WebSocket.OPEN = 1;
            window.WebSocket.CLOSING = 2;
            window.WebSocket.CLOSED = 3;
        """)

        # Inject session into localStorage
        supabase_ref = "yxfljdwsoyrvbvncbyyx"
        storage_key = f"sb-{supabase_ref}-auth-token"
        page.goto("http://localhost:5103/", wait_until="domcontentloaded", timeout=8000)
        page.evaluate(
            "({ key, session }) => { localStorage.setItem(key, JSON.stringify(session)); }",
            {"key": storage_key, "session": FAKE_SESSION},
        )

        # Reload with mocks active
        try:
            page.goto("http://localhost:5103/", wait_until="networkidle", timeout=12000)
        except Exception:
            pass
        page.wait_for_timeout(4000)

        page.screenshot(path=str(SCREENSHOT_DIR / "superpowers.png"))
        print(f"  superpowers: saved (url: {page.url})")

    except Exception as e:
        print(f"  superpowers: ERROR - {e}")
    finally:
        page.unroute_all(behavior="wait")
        context.close()


def main():
    print("=== Taking Screenshots (Vanilla + Superpowers) ===\n")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        screenshot_vanilla(browser)
        screenshot_superpowers(browser)
        browser.close()
    print("\nDone!")


if __name__ == "__main__":
    main()
