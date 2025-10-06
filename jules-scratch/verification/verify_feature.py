import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.goto("http://localhost:5173")

        # Create a new match
        await page.click('button:has-text("Admin")')
        await page.click('button:has-text("Setup")')
        await page.fill('input[placeholder="Team A Name"]', "India")
        await page.fill('input[placeholder="Team B Name"]', "Australia")
        await page.fill('input[placeholder="Overs"]', "1")
        await page.click('button:has-text("Start Match")')

        # Add players
        await page.click('button:has-text("Live Scoring")')
        await page.fill('input[placeholder="New player for India"]', "Rohit")
        await page.click('text=Add')
        await page.fill('input[placeholder="New player for India"]', "Virat")
        await page.click('text=Add')
        await page.fill('input[placeholder="New player for Australia"]', "Starc")
        await page.click('text=Add')

        # Set initial players
        await page.select_option('select', label='Striker', value='1')
        await page.select_option('select', label='Non-Striker', value='2')
        await page.select_option('select', label='Opening Bowler', value='3')
        await page.click('button:has-text("Confirm Players")')

        # Record some scores
        await page.click('button:has-text("4")')
        await page.click('button:has-text("6")')
        await page.click('button:has-text("1")')
        await page.click('button:has-text("W (bowled)")')

        # Take a screenshot
        await page.screenshot(path="jules-scratch/verification/screenshot.png")
        await browser.close()

asyncio.run(main())