const CDP = require('chrome-remote-interface');

(async () => {
  const client = await CDP({port: 9222});
  const {Runtime, DOM, Input} = client;

  // Click on "TabbySpaces DEV" link
  const result = await Runtime.evaluate({
    expression: `
      const link = Array.from(document.querySelectorAll('a')).find(a => a.innerText.includes('TabbySpaces DEV'));
      if (link) {
        link.click();
        'Clicked TabbySpaces DEV';
      } else {
        'TabbySpaces DEV link not found';
      }
    `
  });
  console.log('Result:', result.result.value);

  await client.close();
})().catch(e => console.error('Error:', e.message));
