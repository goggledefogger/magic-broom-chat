#!/usr/bin/env python3
"""
Take screenshots of each framework's chat UI using Playwright with mocked Supabase.
Run with dev servers already started on ports 5101-5104.
"""

import json
import re
from pathlib import Path
from playwright.sync_api import sync_playwright, Route, Request

SCREENSHOT_DIR = Path(__file__).parent / "screenshots"
SCREENSHOT_DIR.mkdir(exist_ok=True)

FAKE_USER_ID = "00000000-0000-0000-0000-000000000001"
FAKE_USER = {
    "id": FAKE_USER_ID,
    "aud": "authenticated",
    "role": "authenticated",
    "email": "demo@magicbroom.dev",
    "email_confirmed_at": "2026-01-01T00:00:00Z",
    "phone": "",
    "confirmed_at": "2026-01-01T00:00:00Z",
    "last_sign_in_at": "2026-03-31T00:00:00Z",
    "app_metadata": {"provider": "email", "providers": ["email"]},
    "user_metadata": {"display_name": "Demo Wizard"},
    "identities": [],
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-03-31T00:00:00Z",
}

FAKE_SESSION = {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjo5OTk5OTk5OTk5LCJzdWIiOiIwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDEiLCJlbWFpbCI6ImRlbW9AbWFnaWNicm9vbS5kZXYiLCJyb2xlIjoiYXV0aGVudGljYXRlZCJ9.fake",
    "token_type": "bearer",
    "expires_in": 86400,
    "expires_at": 9999999999,
    "refresh_token": "fake-refresh-token",
    "user": FAKE_USER,
}

CH1_ID = "11111111-0000-0000-0000-000000000001"

CHANNELS = [
    {"id": CH1_ID, "name": "general", "slug": "general", "description": "General discussion", "type": "standard", "is_archived": False, "is_private": False, "created_by": FAKE_USER_ID, "created_at": "2026-01-01T00:00:00Z", "updated_at": "2026-01-01T00:00:00Z"},
    {"id": "11111111-0000-0000-0000-000000000002", "name": "introductions", "slug": "introductions", "description": "Say hello!", "type": "standard", "is_archived": False, "is_private": False, "created_by": FAKE_USER_ID, "created_at": "2026-01-02T00:00:00Z", "updated_at": "2026-01-02T00:00:00Z"},
    {"id": "11111111-0000-0000-0000-000000000003", "name": "show-and-tell", "slug": "show-and-tell", "description": "Share your projects", "type": "gallery", "is_archived": False, "is_private": False, "created_by": FAKE_USER_ID, "created_at": "2026-01-03T00:00:00Z", "updated_at": "2026-01-03T00:00:00Z"},
    {"id": "11111111-0000-0000-0000-000000000004", "name": "help", "slug": "help", "description": "Ask for help", "type": "standard", "is_archived": False, "is_private": False, "created_by": FAKE_USER_ID, "created_at": "2026-01-04T00:00:00Z", "updated_at": "2026-01-04T00:00:00Z"},
]

PROFILE = {"id": FAKE_USER_ID, "display_name": "Demo Wizard", "avatar_url": None, "role": "instructor", "email": "demo@magicbroom.dev", "created_at": "2026-01-01T00:00:00Z", "updated_at": "2026-01-01T00:00:00Z"}

PROFILES_BY_ID = {
    FAKE_USER_ID: {"display_name": "Demo Wizard", "avatar_url": None},
    "22222222-0000-0000-0000-000000000002": {"display_name": "Luna Starweaver", "avatar_url": None},
    "33333333-0000-0000-0000-000000000003": {"display_name": "Sage Thornberry", "avatar_url": None},
}

MEMBERS = [{"channel_id": ch["id"], "user_id": FAKE_USER_ID, "last_read_at": "2026-03-31T00:00:00Z", "joined_at": "2026-01-01T00:00:00Z"} for ch in CHANNELS]


def make_messages(channel_id: str, with_profile_join: bool):
    """Create mock messages, optionally with embedded profile joins."""
    base = [
        {"id": "m1", "channel_id": channel_id, "user_id": "22222222-0000-0000-0000-000000000002", "content": "Hey everyone! Welcome to Magic Brooms ✨", "created_at": "2026-03-30T10:00:00Z", "fts": None},
        {"id": "m2", "channel_id": channel_id, "user_id": "33333333-0000-0000-0000-000000000003", "content": "This is so cool — love the workshop theme!", "created_at": "2026-03-30T10:05:00Z", "fts": None},
        {"id": "m3", "channel_id": channel_id, "user_id": FAKE_USER_ID, "content": "Thanks! Built this as a framework comparison for the AI course.", "created_at": "2026-03-30T10:10:00Z", "fts": None},
        {"id": "m4", "channel_id": channel_id, "user_id": "22222222-0000-0000-0000-000000000002", "content": "Which framework ended up winning?", "created_at": "2026-03-30T10:12:00Z", "fts": None},
        {"id": "m5", "channel_id": channel_id, "user_id": FAKE_USER_ID, "content": "BMAD — most real features after source code verification 🏆", "created_at": "2026-03-30T10:15:00Z", "fts": None},
    ]
    if with_profile_join:
        for m in base:
            m["profiles"] = PROFILES_BY_ID.get(m["user_id"], {"display_name": "Unknown", "avatar_url": None})
    return base


def handle_supabase_route(route: Route):
    """Universal Supabase API mock handler."""
    url = route.request.url
    headers = route.request.headers

    # Auth endpoints
    if "/auth/v1/" in url:
        if "/token" in url or "/signup" in url:
            return route.fulfill(status=200, content_type="application/json", body=json.dumps(FAKE_SESSION))
        if "/user" in url:
            return route.fulfill(status=200, content_type="application/json", body=json.dumps(FAKE_USER))
        return route.fulfill(status=200, content_type="application/json", body=json.dumps({}))

    # Realtime — return a valid-looking but empty response instead of aborting
    if "/realtime/" in url:
        return route.fulfill(status=200, content_type="application/json", body="{}")

    # REST API
    if "/rest/v1/" not in url:
        return route.continue_()

    # Parse the table from the path
    path_match = re.search(r"/rest/v1/([^?]+)", url)
    if not path_match:
        return route.fulfill(status=200, content_type="application/json", body="[]")
    table = path_match.group(1)

    # Check if single-object expected (PostgREST Accept header)
    accept = headers.get("accept", "")
    is_single = "vnd.pgrst.object" in accept

    # Parse select param to detect profile joins
    select = ""
    if "?" in url:
        for part in url.split("?")[1].split("&"):
            if part.startswith("select="):
                select = part[7:]
    has_profile_join = "profiles" in select

    if table == "channels" or table.startswith("channels?"):
        if is_single:
            # Try to find the channel by ID from URL params
            id_match = re.search(r"id=eq\.([^&]+)", url)
            ch_id = id_match.group(1) if id_match else CH1_ID
            ch = next((c for c in CHANNELS if c["id"] == ch_id), CHANNELS[0])
            return route.fulfill(status=200, content_type="application/json", body=json.dumps(ch))
        return route.fulfill(status=200, content_type="application/json", body=json.dumps(CHANNELS))

    if table == "messages" or table.startswith("messages?"):
        ch_match = re.search(r"channel_id=eq\.([^&]+)", url)
        ch_id = ch_match.group(1) if ch_match else CH1_ID
        msgs = make_messages(ch_id, has_profile_join)
        if is_single:
            return route.fulfill(status=200, content_type="application/json", body=json.dumps(msgs[0]))
        return route.fulfill(status=200, content_type="application/json", body=json.dumps(msgs))

    if table == "profiles" or table.startswith("profiles?"):
        if is_single:
            return route.fulfill(status=200, content_type="application/json", body=json.dumps(PROFILE))
        return route.fulfill(status=200, content_type="application/json", body=json.dumps([PROFILE]))

    if table == "channel_members" or table.startswith("channel_members?"):
        has_channel_join = "channels" in select
        has_profile_join = "profiles" in select
        enriched = []
        for m in MEMBERS:
            entry = {**m, "role": "member"}
            if has_channel_join:
                entry["channels"] = next((c for c in CHANNELS if c["id"] == m["channel_id"]), None)
            if has_profile_join:
                entry["profiles"] = PROFILE
            enriched.append(entry)
        if enriched and (has_channel_join or has_profile_join):
            return route.fulfill(status=200, content_type="application/json", body=json.dumps(enriched))
        return route.fulfill(status=200, content_type="application/json", body=json.dumps(MEMBERS))

    # RPC calls
    if table.startswith("rpc/"):
        return route.fulfill(status=200, content_type="application/json", body=json.dumps([]))

    # Everything else: empty array
    return route.fulfill(status=200, content_type="application/json", body=json.dumps([]))


def screenshot_app(page, name: str, port: int, supabase_ref: str):
    """Screenshot a single framework's chat UI."""
    storage_key = f"sb-{supabase_ref}-auth-token"

    # Set up route mocks (match all supabase domains)
    page.route("**supabase.co/**", handle_supabase_route)

    # Navigate to app root, inject fake session
    page.goto(f"http://localhost:{port}/", wait_until="domcontentloaded", timeout=8000)
    page.evaluate(
        """({ key, session }) => { localStorage.setItem(key, JSON.stringify(session)); }""",
        {"key": storage_key, "session": FAKE_SESSION},
    )

    # Reload to pick up the session from localStorage
    try:
        page.goto(f"http://localhost:{port}/", wait_until="networkidle", timeout=12000)
    except Exception:
        pass
    page.wait_for_timeout(2000)

    # Try to click the first channel link in the sidebar
    # Different apps use different selectors
    selectors_to_try = [
        'a[href*="/channels/"]',           # most apps use <a> links
        'button:has-text("general")',       # some use buttons
        'text=general',                     # text match
    ]
    for sel in selectors_to_try:
        try:
            el = page.locator(sel).first
            if el.is_visible(timeout=1000):
                el.click()
                page.wait_for_timeout(2000)
                break
        except Exception:
            continue

    page.wait_for_timeout(1000)

    # Take screenshot
    out = SCREENSHOT_DIR / f"{name}.png"
    page.screenshot(path=str(out))
    print(f"  {name}: saved {out.name} (url: {page.url})")

    # Clean up routes for next app
    page.unroute_all(behavior="wait")


def main():
    print("=== Taking Framework Screenshots ===\n")

    apps = [
        ("compound", 5102, "nnjqkhlkwslsyvdmjqsk"),
        ("superpowers", 5103, "yxfljdwsoyrvbvncbyyx"),
        ("gstack", 5104, "nnjqkhlkwslsyvdmjqsk"),
    ]

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        for name, port, ref in apps:
            print(f"  Screenshotting {name} on port {port}...")
            context = browser.new_context(viewport={"width": 1920, "height": 1080})
            page = context.new_page()
            try:
                screenshot_app(page, name, port, ref)
            except Exception as e:
                print(f"  {name}: ERROR - {e}")
            finally:
                context.close()

        # Also screenshot login pages as fallback
        for name, port in [("compound_login", 5102), ("superpowers_login", 5103)]:
            print(f"  Screenshotting {name} on port {port}...")
            context = browser.new_context(viewport={"width": 1920, "height": 1080})
            page = context.new_page()
            try:
                page.goto(f"http://localhost:{port}/login", wait_until="networkidle", timeout=8000)
                page.wait_for_timeout(1000)
                out = SCREENSHOT_DIR / f"{name}.png"
                page.screenshot(path=str(out))
                print(f"  {name}: saved {out.name}")
            except Exception as e:
                print(f"  {name}: ERROR - {e}")
            finally:
                context.close()

        browser.close()

    print("\nDone!")


if __name__ == "__main__":
    main()
