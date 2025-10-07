import time
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()

    # Give the server time to start
    time.sleep(10)

    page.goto("http://localhost:3000")

    # Login as Admin
    page.click('button:has-text("Admin")')

    # Go to Match Setup
    page.click('button:has-text("Match Setup")')

    # Setup Team A
    page.fill('input[placeholder="Team A Name"]', "Team A")
    page.fill('input[placeholder="Player 1 Name for Team A"]', "Player A1")
    page.click('button:has-text("Add Player to Team A")')

    # Setup Team B
    page.fill('input[placeholder="Team B Name"]', "Team B")
    page.fill('input[placeholder="Player 1 Name for Team B"]', "Player B1")
    page.click('button:has-text("Add Player to Team B")')

    # Start Match
    page.click('button:has-text("Start Match")')

    # Select opening players
    page.select_option('select:nth-of-type(1)', index=1)  # Striker
    page.select_option('select:nth-of-type(2)', index=2)  # Non-striker
    page.select_option('select:nth-of-type(3)', index=1)  # Bowler
    page.click('button:has-text("Confirm Players")')

    # Record a 4
    page.click('button:has-text("4")')

    # Take screenshot
    page.screenshot(path="jules-scratch/verification/verification.png")

    browser.close()