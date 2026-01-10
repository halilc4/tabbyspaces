const CDP = require('chrome-remote-interface');

(async () => {
  const client = await CDP({port: 9222});
  const {Runtime, DOM} = client;

  // Get page title
  const title = await Runtime.evaluate({expression: 'document.title'});
  console.log('Title:', title.result.value);

  // Get all clickable elements
  const clickables = await Runtime.evaluate({
    expression: `
      Array.from(document.querySelectorAll('button, [role=button], .btn, a, [ng-click]'))
        .map(el => ({
          tag: el.tagName,
          text: (el.innerText || el.textContent || '').trim().substring(0, 50),
          class: (el.className || '').substring(0, 50)
        }))
        .slice(0, 30)
    `,
    returnByValue: true
  });
  console.log('Clickable elements:');
  console.log(JSON.stringify(clickables.result.value, null, 2));

  await client.close();
})().catch(e => console.error('Error:', e.message));
