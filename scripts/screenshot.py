import pyautogui
from pathlib import Path
from datetime import datetime

# =========================
# CONFIGURATION
# =========================

POSITION_1 = (50, 105)  # First corner (x, y)
POSITION_2 = (975, 1000)  # Opposite corner (x, y)

OUTPUT_DIR = Path(__file__).resolve().parent.parent / "screenshot"

# =========================
# SCREENSHOT
# =========================

def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    x1, y1 = POSITION_1
    x2, y2 = POSITION_2

    left = min(x1, x2)
    top = min(y1, y2)
    width = abs(x2 - x1)
    height = abs(y2 - y1)

    if width == 0 or height == 0:
        raise ValueError("Screenshot width and height must be greater than zero.")

    filename = f"screenshot_{datetime.now():%Y%m%d_%H%M%S_%f}.png"
    output_path = OUTPUT_DIR / filename

    screenshot = pyautogui.screenshot(
        region=(left, top, width, height)
    )
    screenshot.save(output_path)

    print(f"Screenshot saved: {output_path}")


if __name__ == "__main__":
    main()