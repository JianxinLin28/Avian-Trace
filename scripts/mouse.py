import pyautogui
import keyboard
import time

print("Recording mouse position. Press Q to stop.")

while not keyboard.is_pressed("q"):
    x, y = pyautogui.position()
    print(f"X: {x}, Y: {y}    ", end="\r", flush=True)
    time.sleep(0.1)

print("\nStopped.")