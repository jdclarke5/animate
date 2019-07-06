
var loadingTabId;

async function loadAndToggle() {
    try {
        // Inject content scripts into active tab when browser action is clicked
        tabs = await browser.tabs.query({active: true, currentWindow: true});
        loadingTabId = tabs[0].id;
        await browser.tabs.executeScript(loadingTabId, { file: 'browser-polyfill.min.js' });
        await Promise.all([
            browser.tabs.executeScript(loadingTabId, { file: '/content_scripts/animate.js' }),
            browser.tabs.insertCSS(loadingTabId, { file: '/content_scripts/animate-extension.css' }),
            browser.tabs.insertCSS(loadingTabId, { file: '/content_scripts/animate.min.css' }),
        ]);
        toggleSidebar();
    } catch {
        disable();
    }
}

async function toggleSidebar() {
    browser.tabs.sendMessage(loadingTabId, {
        command: 'toggle',
    });
}

function disable() {
    browser.browserAction.disable(loadingTabId);
    browser.browserAction.setTitle({
        title: 'Cannot animate this page',
        tabId: loadingTabId,
    });
}

function enable(tabId, changeInfo) {
    if (!changeInfo.status) {
        return;
    };
    browser.browserAction.enable(tabId);
    browser.browserAction.setTitle({
        title: 'Animate!',
        tabId: tabId,
    });
}

// (Re-)enable on tab URL changes
browser.tabs.onUpdated.addListener(enable);

browser.browserAction.onClicked.addListener(loadAndToggle);
