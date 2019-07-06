
(function () {

  // Only run once
  if (window.animateHasRun) {
    return;
  }
  window.animateHasRun = true;

  /**
   * Helper function to parse the form and construct 
   * the animation detail, which looks like:
   * {
   *   selector: 'img:hover',
   *   keyframes: '' or '@keyframes...',
   *   options: `
   *     animation-name: ${animationName};
   *     animation-duration: 1s;
   *     animation-delay: 0s;
   *     animation-iteration-count: infinite;
   *     animation-direction: alternate;
   *     animation-timing-function: ease-in-out;
   *     animation-fill-mode: none;
   *   `
   * }
   */
  function _constructAnimationDetail() {
    var detail = {};
    // Get sidebar shadow
    var sidebar = document.querySelector('#animate-sidebar');
    shadow = sidebar.shadowRoot
    // Selected tabs
    var selected = shadow.querySelectorAll('.tab[selected]');
    // selector
    switch (selected[0].innerText) {
      case 'element':
        detail.selector = `.${selectedElementClass}`;
        break;
      case 'predefined':
        detail.selector = shadow.querySelector('#selector-selector').value + shadow.querySelector('#selector-pseudoclass').value;
        break;
      case 'custom':
        detail.selector = shadow.querySelector('#selector-custom').value;
        break;
    }
    // keyframes
    // animationName to be put with animation options
    var animationName;
    switch (selected[1].innerText) {
      case 'animate.css':
        animationName = shadow.querySelector('#animation-animate-css').value;
        detail.keyframes = '';
        break;
      case 'construct':
        // Generate random name
        animationName = `animate-constructed-${Math.round(Math.random()*1000000)}`;
        // Create the 'to' @keyframes animation CSS property
        var to = '\n';
        // Transform property
        var transformProperties = [
          'translate',
          'scale',
          'rotate',
          'skew',
        ];
        var transformTo = '';
        transformProperties.forEach( (t) => {
          var value = shadow.querySelector(`#animation-construct-${t}`).value;
          if (`${value}` !== '') {
            transformTo += `${t}(${value}) `;
          }
        });
        if (transformTo) {
          to += `transform: ${transformTo};\n`;
        }
        // Straight properties
        var properties = [
          'transform-origin',
          'width',
          'height',
          'margin',
          'padding',
          'background',
          'opacity',
          'border',
          'outline',
          'box-shadow',
          'color',
          'font',
          'letter-spacing',
          'text-shadow',
        ];
        properties.forEach( (p) => {
          var value = shadow.querySelector(`#animation-construct-${p}`).value;
          if (`${value}` !== '') {
            to += `${p}: ${value};\n`
          }
        });
        // Construct keyframes
        detail.keyframes = `
          @keyframes ${animationName} {
            to {${to}}
          }
        `;
        break;
      case 'custom':
        var custom = shadow.querySelector('#animation-custom').value;
        detail.keyframes = custom;
        // Extract name as second non-whitespace and chop off any trailing curly
        var words = custom.match(/\S+/g);
        if (words && words.length > 1) {
          animationName = words[1].split('{')[0];
        }
        break;
    }
    // options
    switch (selected[2].innerText) {
      case 'simple':
        detail.options = `
          animation-name: ${animationName};
          animation-duration: ${shadow.querySelector('#options-duration').value};
          animation-delay: 0s;
          animation-iteration-count: infinite;
          animation-direction: alternate;
          animation-timing-function: ${shadow.querySelector('#options-timing-function').value};
          animation-fill-mode: none;
        `;
        break;
      case 'advanced':
        detail.options = `
          animation-name: ${animationName};
          animation-duration: ${shadow.querySelector('#options-advanced-duration').value || '1s'};
          animation-delay: ${shadow.querySelector('#options-advanced-delay').value || '0s'};
          animation-iteration-count: ${shadow.querySelector('#options-advanced-iteration-count').value || 'infinite'};
          animation-direction: ${shadow.querySelector('#options-advanced-direction').value || 'alternate'};
          animation-timing-function: ${shadow.querySelector('#options-advanced-timing-function').value || 'ease'};
          animation-fill-mode: ${shadow.querySelector('#options-advanced-fill-mode').value || 'none'};
        `;
    }
    return detail;
  }

  function handleAnimate() {
    var detail = _constructAnimationDetail();
    // Contruct animation CSS ensuring html (containing the sidebar)
    // never gets animated
    var css = `
      ${detail.keyframes}
      ${detail.selector} {
        ${detail.options}
      }
      html { animation: none; }
    `;
    sheet.innerHTML += css;
    sheetHistory.push(sheet.innerHTML);
  }

  function handleUndo() {
    if (sheetHistory.length === 1) {
      return;
    }
    sheetHistory.pop();
    sheet.innerHTML = sheetHistory[sheetHistory.length-1];
  }

  function handleReset() {
    sheetHistory = [''];
    sheet.innerHTML = '';
  }

  function handleSelect() {
    // Mouse event handlers
    var handleMouseClick = (e) => {
      // Prevent navigation
      e.preventDefault();
      e.stopPropagation();
      // Cannot animate elements without display block
      // var displayStyle = getComputedStyle(e.target).display;
      // if (!displayStyle || !displayStyle.includes('block')) {
      //   return;
      // }
      // Attach a random string as class
      selectedElementClass = `animate-${Math.round(Math.random()*1000000)}`;
      e.target.classList.add(selectedElementClass);
      // Remove the mouse handlers
      e.target.classList.remove('animate-selection');
      document.body.removeEventListener('mouseover', handleMouseOver);
      e.target.removeEventListener('click', handleMouseClick);
      e.target.removeEventListener('mouseout', handleMouseOut);
      // Show the sidebar with element selected indicated
      var sidebar = document.querySelector('#animate-sidebar');
      var nodeName = e.target.nodeName.toLowerCase();
      sidebar.shadowRoot.querySelector('#select-text').innerHTML = 
        `(<code>&lt;${nodeName}&gt;</code> element selected)`;
      sidebar.style.display = 'inline-block';
    }
    var handleMouseOut = (e) => {
      // Remove mouse handlers
      e.target.removeEventListener('click', handleMouseClick);
      e.target.removeEventListener('mouseout', handleMouseOut);
      // Remove highlight class
      e.target.classList.remove('animate-selection');
    }
    var handleMouseOver = (e) => {
      // Add mouse handlers
      e.target.addEventListener('click', handleMouseClick);
      e.target.addEventListener('mouseout', handleMouseOut);
      // Cannot animate elements without display block
      // var displayStyle = getComputedStyle(e.target).display;
      // if (!displayStyle || !displayStyle.includes('block')) {
      //   return;
      // }
      // Add highlight class
      e.target.classList.add('animate-selection');
    }
    // Hide the sidebar
    document.querySelector('#animate-sidebar').style.display = 'none';
    // Add mouseover listener to the body
    document.body.addEventListener('mouseover', handleMouseOver);
  }

  function handleTabSelection(e) {
    // Set selected tab
    var tabs = e.target.parentElement;
    Array.from(tabs.children).forEach((tab) => {
      tab.removeAttribute('selected');
    });
    e.target.setAttribute('selected', '');
    // Set selected container
    var tabsContainer = tabs.parentElement;
    Array.from(tabsContainer.children).forEach((tabContent) => {
      tabContent.removeAttribute('selected');
      if (e.target.innerText === tabContent.getAttribute('tab')) {
        tabContent.setAttribute('selected', '');
      }
    });
  }

  function toggleSidebar() {
    // Toggle display if already initialised
    if (window.animateHasInit) {
      var sidebar = document.querySelector('#animate-sidebar');
      sidebar.style.display = sidebar.style.display != 'none' ? 'none' : 'inline-block';
      return;
    }
    // Initialise
    var sidebarURL = browser.runtime.getURL('/content_scripts/sidebar.html');
    fetch(sidebarURL)
      .then((response) => response.text())
      .then((html) => {
        // Insert sidebar adjacent to body (so it doesn't animate itself)
        var sidebar = document.createElement('div');
        sidebar.setAttribute('id', 'animate-sidebar');
        document.body.insertAdjacentElement('beforebegin', sidebar);
        // Attach shadow to ensure no styling to/from document
        var shadow = sidebar.attachShadow({ mode: 'open' });
        shadow.innerHTML += html;
        // Tab handlers
        Array.from(shadow.querySelectorAll('.tab')).forEach((tab) => {
          tab.addEventListener('click', handleTabSelection);
        });
        // Button handlers
        shadow.querySelector('#animate').addEventListener('click', handleAnimate);
        shadow.querySelector('#undo').addEventListener('click', handleUndo);
        shadow.querySelector('#reset').addEventListener('click', handleReset);
        shadow.querySelector('#select').addEventListener('click', handleSelect);
        // We are done
        window.animateHasInit = true;
      })
      .catch((err) => {
        console.log(`Error during init: ${err}`);
      });
  }

  // Create style sheet and sheet history (for undos)
  var sheet = document.createElement('style');
  document.body.appendChild(sheet);
  var sheetHistory = [''];

  // Class for manully selected element
  var selectedElementClass = '';

  // Listen for toggle message
  browser.runtime.onMessage.addListener((message) => {
    if (message.command === 'toggle') {
      toggleSidebar();
    }
  });

})();
