"""Test CDP connection to Tabby - click on TabbySpaces settings"""
import pychrome
import time

# Connect to Tabby
browser = pychrome.Browser(url="http://localhost:9222")
tabs = browser.list_tab()
print(f"Found {len(tabs)} tabs")

# Get the first tab (main Tabby window)
tab = tabs[0]
print(f"Using first tab")
tab.start()

# Click on TabbySpaces link
print("\nClicking on 'TabbySpaces' link...")
result = tab.Runtime.evaluate(expression="""
    const link = Array.from(document.querySelectorAll('a.nav-link'))
        .find(a => a.innerText.trim() === 'TabbySpaces');
    if (link) {
        link.click();
        'Clicked TabbySpaces!';
    } else {
        'TabbySpaces link not found';
    }
""")
print(f"Result: {result.get('result', {}).get('value')}")

time.sleep(0.3)

# Verify we're on TabbySpaces page - look for workspace elements
result = tab.Runtime.evaluate(expression="""
    // Check for TabbySpaces specific content
    const content = document.body.innerText;
    const hasWorkspaces = content.includes('Workspace') || content.includes('workspace');
    const activeLink = document.querySelector('a.nav-link.active');
    ({
        activePage: activeLink ? activeLink.innerText.trim() : 'unknown',
        hasWorkspaceContent: hasWorkspaces,
        pageSnippet: content.substring(0, 500)
    });
""", returnByValue=True)

data = result.get('result', {}).get('value', {})
print(f"\nActive page: {data.get('activePage')}")
print(f"Has workspace content: {data.get('hasWorkspaceContent')}")
print(f"\nPage snippet:\n{data.get('pageSnippet', '')[:300]}...")

tab.stop()
print("\nDone!")
