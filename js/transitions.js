(function() {
    // Don't run transitions if using file:// protocol
    if (window.location.protocol === 'file:') {
        console.warn('Page transitions require serving files from a web server. Using file:// protocol will disable transitions.');
        return;
    }

    console.log('Transitions.js initialized');

    // Cache for storing fetched pages
    const cache = {};

    // Load page content via fetch 
    function loadPage(url) {
        if (cache[url]) {
            return Promise.resolve(cache[url]);
        }

        return fetch(url, {
            method: 'GET'
        }).then(function(response) {
            cache[url] = response.text();
            return cache[url];
        });
    }

    // Handle page transitions
    function changePage() {
        const url = window.location.href;
        console.log('Changing page to:', url);

        loadPage(url).then(function(responseText) {
            console.log('Page content loaded');
            const wrapper = document.createElement('div');
            wrapper.innerHTML = responseText;

            // Look for main content sections with multiple possible IDs
            const oldContent = document.querySelector('main > section');
            let newContent = wrapper.querySelector('main > section');

            // Try alternate content types if main section not found
            if (!newContent) {
                console.log('Trying to find alternate content structure');
                newContent = wrapper.querySelector('main > .stackgrid');
                if (!newContent) {
                    newContent = wrapper.querySelector('main > #works');
                }
            }

            console.log('Old content:', oldContent?.id);
            console.log('New content:', newContent?.id || 'content found but no ID');

            if(oldContent && newContent) {
                // Update page title
                document.title = wrapper.querySelector('title').textContent;
                
                // Set initial styles
                oldContent.style.position = 'absolute';
                oldContent.style.width = '100%';
                oldContent.style.top = '0';
                oldContent.style.left = '0';
                oldContent.style.opacity = '1';
                oldContent.style.zIndex = '1';
                
                newContent.style.opacity = '0';
                newContent.style.position = 'relative';
                newContent.style.zIndex = '2';
                
                // Add to DOM
                document.querySelector('main').appendChild(newContent);
                
                // Force reflow
                newContent.offsetHeight;
                
                // Start transition
                oldContent.style.transition = 'opacity 1s ease-in-out';
                newContent.style.transition = 'opacity 1s ease-in-out';
                
                // Trigger animations
                requestAnimationFrame(() => {
                    oldContent.style.opacity = '0';
                    newContent.style.opacity = '1';
                    
                    console.log('Transition started');
                    
                    // Clean up after transition
                    setTimeout(() => {
                        oldContent.parentNode.removeChild(oldContent);
                        console.log('Transition completed');
                    }, 1000);
                });
            } else {
                console.warn('Required content sections not found, falling back to normal navigation');
                window.location.href = url;
            }
        }).catch(function(err) {
            console.error('Error during page transition:', err);
            window.location.href = url; // Fallback to regular navigation
        });
    }

    // Listen for back/forward navigation
    window.addEventListener('popstate', changePage);

    // Handle link clicks
    document.addEventListener('click', function(e) {
        let el = e.target;

        // Find closest link parent
        while (el && !el.href) {
            el = el.parentNode;
        }

        // Handle only internal links
        if (el && el.href && el.href.indexOf(window.location.origin) === 0) {
            console.log('Link clicked:', el.href);
            e.preventDefault();
            history.pushState(null, null, el.href);
            changePage();
        }
    });

})();
