#!/usr/bin/env python3
"""
Magic Brooms — 30-second framework comparison montage video.
Generates scene PNGs with Pillow, assembles with FFmpeg xfade transitions.
"""

import os
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

# ── Config ──────────────────────────────────────────────────────────────────

W, H = 1920, 1080
FPS = 30
FONT_PATH = "/System/Library/Fonts/Helvetica.ttc"
BASE_DIR = Path(__file__).parent
FRAMES_DIR = BASE_DIR / "frames"
SCREENSHOTS_DIR = BASE_DIR / "screenshots"
OUTPUT = BASE_DIR / "montage.mp4"

# Colors
BG = "#3F0E40"
BG_ALT = "#4A154B"
BG_DARK = "#2A0A2B"
WHITE = "#FFFFFF"
MUTED = "#B0A0B0"
VERY_MUTED = "#7A6A7A"
PINK = "#E01E5A"
BLUE = "#36C5F0"
PURPLE = "#7B68EE"
GOLD = "#ECB22E"
GREEN = "#2BAC76"

# Fonts (loaded lazily)
_font_cache = {}


def font(style="regular", size=40):
    idx = {"regular": 0, "bold": 1, "light": 4}[style]
    key = (idx, size)
    if key not in _font_cache:
        _font_cache[key] = ImageFont.truetype(FONT_PATH, size, index=idx)
    return _font_cache[key]


def hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))


def gradient_bg(color1=BG, color2=BG_ALT):
    """Create a subtle diagonal gradient background."""
    img = Image.new("RGB", (W, H))
    c1, c2 = hex_to_rgb(color1), hex_to_rgb(color2)
    for y in range(H):
        r = y / H
        row_color = tuple(int(c1[i] + (c2[i] - c1[i]) * r) for i in range(3))
        for x in range(W):
            img.putpixel((x, y), row_color)
    return img


def solid_bg(color=BG):
    return Image.new("RGB", (W, H), hex_to_rgb(color))


def draw_text_centered(draw, y, text, f, color):
    """Draw text horizontally centered at given y."""
    bbox = draw.textbbox((0, 0), text, font=f)
    tw = bbox[2] - bbox[0]
    x = (W - tw) // 2
    draw.text((x, y), text, font=f, fill=hex_to_rgb(color))


def draw_accent_bar(draw, color, x=160, y_start=260, y_end=820):
    """Draw a vertical accent bar."""
    draw.rectangle([x, y_start, x + 5, y_end], fill=hex_to_rgb(color))


# ── Scene Generators ────────────────────────────────────────────────────────


def scene_title():
    img = gradient_bg()
    draw = ImageDraw.Draw(img)

    # Thin horizontal rule
    rule_y = 520
    rule_margin = 500
    draw.rectangle(
        [rule_margin, rule_y, W - rule_margin, rule_y + 1],
        fill=hex_to_rgb(VERY_MUTED),
    )

    draw_text_centered(draw, 360, "MAGIC BROOM CHAT", font("bold", 72), WHITE)
    draw_text_centered(
        draw, 460, "One app. Five AI frameworks. One winner.", font("light", 32), MUTED
    )
    draw_text_centered(
        draw,
        560,
        "A Portland Career  |  AI-Assisted Development  |  2026",
        font("regular", 22),
        VERY_MUTED,
    )

    return img


def scene_experiment():
    img = solid_bg()
    draw = ImageDraw.Draw(img)

    draw_text_centered(draw, 320, "THE EXPERIMENT", font("bold", 56), WHITE)
    draw_text_centered(
        draw,
        410,
        "Build the same Slack-like chat app",
        font("light", 34),
        MUTED,
    )
    draw_text_centered(
        draw,
        460,
        "5 different ways. Compare everything.",
        font("light", 34),
        MUTED,
    )

    # Five colored dots
    colors = [PINK, BLUE, PURPLE, GOLD, GREEN]
    dot_y = 580
    spacing = 60
    start_x = (W - (len(colors) - 1) * spacing) // 2
    for i, c in enumerate(colors):
        x = start_x + i * spacing
        draw.ellipse([x - 10, dot_y - 10, x + 10, dot_y + 10], fill=hex_to_rgb(c))

    return img


def load_screenshot(name):
    """Load a screenshot and return it, or None if not found."""
    path = SCREENSHOTS_DIR / f"{name}.png"
    if path.exists():
        return Image.open(path)
    return None


def add_screenshot_inset(img, screenshot, accent):
    """Overlay a screenshot as a bordered inset on the right side of a card."""
    if screenshot is None:
        return img

    # Inset dimensions and position
    inset_w = 700
    inset_h = 440
    inset_x = W - inset_w - 100
    inset_y = 300

    # Resize screenshot to fit
    shot = screenshot.copy()
    shot.thumbnail((inset_w - 8, inset_h - 8), Image.LANCZOS)
    sw, sh = shot.size

    # Draw a border/frame
    draw = ImageDraw.Draw(img)
    border = 3
    frame_x = inset_x + (inset_w - sw) // 2 - border
    frame_y = inset_y + (inset_h - sh) // 2 - border
    draw.rectangle(
        [frame_x, frame_y, frame_x + sw + 2 * border, frame_y + sh + 2 * border],
        fill=hex_to_rgb(accent),
    )

    # Paste screenshot
    paste_x = frame_x + border
    paste_y = frame_y + border
    img.paste(shot, (paste_x, paste_y))

    return img


def scene_framework(title, subtitle, stats, tagline, accent, screenshot_name=None):
    """Generic framework card layout with optional screenshot inset."""
    img = solid_bg()
    draw = ImageDraw.Draw(img)

    # If we have a screenshot, text goes on the left half only
    has_shot = screenshot_name and (SCREENSHOTS_DIR / f"{screenshot_name}.png").exists()
    left = 120 if has_shot else 200
    max_text_x = 950 if has_shot else W - 200

    draw_accent_bar(draw, accent, x=left - 30, y_start=250, y_end=780)

    # Title
    draw.text((left, 260), title, font=font("bold", 48 if has_shot else 52), fill=hex_to_rgb(accent))

    # Subtitle
    draw.text((left, 335), subtitle, font=font("light", 26), fill=hex_to_rgb(MUTED))

    # Stats grid (2 columns, narrower if screenshot present)
    grid_y = 420
    col2_x = left + 380 if has_shot else left + 480
    row_h = 70
    for i, (label, value) in enumerate(stats):
        row = i // 2
        col = i % 2
        x = left if col == 0 else col2_x
        y = grid_y + row * row_h

        draw.text((x, y), value, font=font("bold", 26), fill=hex_to_rgb(WHITE))
        draw.text(
            (x, y + 30), label, font=font("regular", 16), fill=hex_to_rgb(VERY_MUTED)
        )

    # Tagline
    draw.text(
        (left, 700), tagline, font=font("regular", 22), fill=hex_to_rgb(MUTED)
    )

    # Add screenshot inset if available
    if has_shot:
        screenshot = load_screenshot(screenshot_name)
        img = add_screenshot_inset(img, screenshot, accent)

    return img


def scene_vanilla():
    return scene_framework(
        "VANILLA CLAUDE CODE",
        "No framework. Pure vibes.",
        [
            ("source files", "7 files"),
            ("to working app", "3 prompts"),
            ("backend", "Express + Socket.io"),
            ("database", "SQLite"),
        ],
        "Fastest to functional. Zero planning artifacts.",
        PINK,
        screenshot_name="vanilla",
    )


def scene_compound():
    return scene_framework(
        "COMPOUND ENGINEERING",
        "80/20 planning-to-execution ratio.",
        [
            ("planning", "28 min"),
            ("building", "25 min"),
            ("source files", "31 files"),
            ("approach", "Schema-first"),
        ],
        "Best process. Cleanest for teaching.",
        BLUE,
        screenshot_name="compound",
    )


def scene_superpowers():
    return scene_framework(
        "SUPERPOWERS",
        "TDD-first. Quality gates everywhere.",
        [
            ("test files", "6 tests"),
            ("source files", "45 files"),
            ("token usage", "5-10x more"),
            ("isolation", "Git worktrees"),
        ],
        "Most tested. Most expensive.",
        PURPLE,
        screenshot_name="superpowers",
    )


def scene_gstack():
    return scene_framework(
        "GSTACK",
        "Design-first. Virtual engineering team.",
        [
            ("animations", "Framer Motion"),
            ("navigation", "Cmd+K palette"),
            ("loading", "Skeleton loaders"),
            ("source files", "40 files"),
        ],
        'Prettiest build. Originally declared "winner."',
        GOLD,
        screenshot_name="gstack",
    )


def scene_bmad():
    return scene_framework(
        "BMAD METHOD",
        "Agent-based agile. Heaviest planning upfront.",
        [
            ("planning", "2-3 days"),
            ("source files", "38 files"),
            ("artifacts", "PRD + Architecture"),
            ("process", "12-step agile"),
        ],
        "Gallery channels, emoji reactions, admin roles, password reset.",
        GREEN,
        screenshot_name="bmad",
    )


def scene_twist():
    img = solid_bg(BG_DARK)
    draw = ImageDraw.Draw(img)

    draw_text_centered(draw, 280, "PLOT TWIST", font("bold", 64), GOLD)
    draw_text_centered(
        draw,
        390,
        'gstack looked like the winner...',
        font("regular", 34),
        WHITE,
    )
    draw_text_centered(
        draw,
        450,
        "But a source code audit told a different story.",
        font("regular", 34),
        WHITE,
    )
    draw_text_centered(
        draw,
        550,
        "Feature-by-feature verification  |  Every claim checked against code",
        font("light", 22),
        VERY_MUTED,
    )

    return img


def scene_winner():
    # Green-tinted gradient
    img = Image.new("RGB", (W, H))
    c1, c2 = hex_to_rgb(BG), hex_to_rgb("#1a2a20")
    for y in range(H):
        r = y / H
        row_color = tuple(int(c1[i] + (c2[i] - c1[i]) * r) for i in range(3))
        for x in range(W):
            img.putpixel((x, y), row_color)
    draw = ImageDraw.Draw(img)

    # Trophy / winner line
    draw_text_centered(draw, 240, "WINNER", font("bold", 36), GOLD)

    # Thin gold rule
    rule_margin = 650
    draw.rectangle(
        [rule_margin, 300, W - rule_margin, 301], fill=hex_to_rgb(GOLD)
    )

    draw_text_centered(draw, 340, "BMAD METHOD", font("bold", 80), GREEN)
    draw_text_centered(
        draw,
        460,
        "Most real features. Best architecture.",
        font("regular", 32),
        WHITE,
    )
    draw_text_centered(
        draw, 510, "Deployed to production.", font("regular", 32), WHITE
    )
    draw_text_centered(
        draw, 610, "magic-brooms.vercel.app", font("light", 24), VERY_MUTED
    )

    return img


def scene_closing():
    img = gradient_bg()
    draw = ImageDraw.Draw(img)

    draw_text_centered(draw, 350, "Planning wins.", font("bold", 56), WHITE)
    draw_text_centered(
        draw,
        440,
        "The framework that invested most in upfront design",
        font("light", 30),
        MUTED,
    )
    draw_text_centered(
        draw,
        485,
        "shipped the most real functionality.",
        font("light", 30),
        MUTED,
    )
    draw_text_centered(
        draw,
        600,
        "AI-Assisted Development Course  |  A Portland Career  |  2026",
        font("regular", 20),
        VERY_MUTED,
    )

    return img


# ── Assembly ────────────────────────────────────────────────────────────────

# (scene_fn, duration_seconds, transition_type, transition_duration)
# Durations are padded so that after xfade overlaps, total ≈ 30s.
# Each xfade eats (transition_duration) from the total, so we add that back.
SCENES = [
    (scene_title, 4.0, "fadeblack", 0.5),
    (scene_experiment, 3.5, "slideleft", 0.4),
    (scene_vanilla, 3.0, "slideleft", 0.4),
    (scene_compound, 3.0, "slideleft", 0.4),
    (scene_superpowers, 3.0, "slideleft", 0.4),
    (scene_gstack, 3.0, "fadeblack", 0.5),
    (scene_bmad, 3.5, "fadeblack", 0.6),
    (scene_twist, 4.0, "fadeblack", 0.5),
    (scene_winner, 4.5, "fadeblack", 0.5),
    (scene_closing, 3.5, None, 0),  # final scene, no transition out
]


def generate_frames():
    """Generate all scene PNGs."""
    FRAMES_DIR.mkdir(parents=True, exist_ok=True)
    paths = []
    for i, (scene_fn, *_) in enumerate(SCENES):
        path = FRAMES_DIR / f"scene_{i + 1:02d}.png"
        print(f"  Generating {path.name}...")
        img = scene_fn()
        img.save(path, "PNG")
        paths.append(path)
    return paths


def build_ffmpeg_cmd(paths):
    """Build the FFmpeg command with chained xfade transitions."""
    n = len(SCENES)

    # Input args: each scene looped for its duration
    inputs = []
    for i, (_, dur, _, _) in enumerate(SCENES):
        inputs.extend(["-loop", "1", "-t", str(dur), "-i", str(paths[i])])

    # Build xfade filter chain
    # For chained xfade, each offset is relative to the START of the combined
    # output so far. offset = (cumulative duration up to this point) - (cumulative transitions so far) - (this transition duration... no)
    #
    # Actually: for a chain of xfades, the offset for xfade N is:
    #   offset_N = sum(durations[0..N]) - sum(transition_durations[0..N-1]) - transition_duration_N
    # More precisely, it tracks the running length of the output stream.

    filters = []
    cumulative = SCENES[0][1]  # duration of first scene

    for i in range(1, n):
        _, dur_i, trans_type, trans_dur = SCENES[i]

        if i < n - 1:
            # Use the transition from scene i-1 (the outgoing scene's transition)
            _, _, out_trans, out_dur = SCENES[i - 1]
        else:
            # Last transition: use scene i-1's transition
            _, _, out_trans, out_dur = SCENES[i - 1]

        # For the first xfade, inputs are [0] and [1]
        # For subsequent, input is [v{i-1}] and [i]
        left = f"[{0}]" if i == 1 else f"[v{i - 1}]"
        right = f"[{i}]"
        out_label = f"[v{i}]"

        # offset = point in the output stream where the transition starts
        offset = cumulative - out_dur

        if i < n - 1:
            filters.append(
                f"{left}{right}xfade=transition={out_trans}:duration={out_dur}:offset={offset:.2f}{out_label}"
            )
        else:
            # Last xfade — also add final fade-out
            filters.append(
                f"{left}{right}xfade=transition={out_trans}:duration={out_dur}:offset={offset:.2f}[vlast]"
            )

        # Update cumulative: the output duration grows by (dur_i - out_dur)
        cumulative += dur_i - out_dur

    # Add final fade-to-black on the last second
    filters.append(f"[vlast]fade=t=out:st={cumulative - 1.0:.2f}:d=1.0[vout]")

    filter_complex = ";\n    ".join(filters)

    cmd = [
        "ffmpeg",
        "-y",  # overwrite
        *inputs,
        "-filter_complex",
        filter_complex,
        "-map",
        "[vout]",
        "-r",
        str(FPS),
        "-pix_fmt",
        "yuv420p",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "18",
        str(OUTPUT),
    ]
    return cmd


def main():
    print("=== Magic Brooms Montage Generator ===\n")

    print("1. Generating scene frames...")
    paths = generate_frames()
    print(f"   Done: {len(paths)} frames\n")

    print("2. Building FFmpeg command...")
    cmd = build_ffmpeg_cmd(paths)
    print(f"   Filter chain built\n")

    print("3. Running FFmpeg...")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"   FFMPEG FAILED (exit {result.returncode})")
        print(result.stderr[-2000:] if len(result.stderr) > 2000 else result.stderr)
        return

    print(f"   Output: {OUTPUT}")
    print(f"   Size: {OUTPUT.stat().st_size / 1024 / 1024:.1f} MB\n")

    # Quick probe
    probe = subprocess.run(
        ["ffprobe", "-v", "quiet", "-show_format", "-show_streams", str(OUTPUT)],
        capture_output=True,
        text=True,
    )
    for line in probe.stdout.splitlines():
        if any(k in line for k in ["duration=", "width=", "height=", "r_frame_rate="]):
            print(f"   {line.strip()}")

    print("\nDone!")


if __name__ == "__main__":
    main()
