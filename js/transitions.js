(function() {
    // Don't run transitions if using file:// protocol
    if (window.location.protocol === 'file:') {
        console.warn('Page transitions require serving files from a web server. Using file:// protocol will disable transitions.');
        return;
    }

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

        loadPage(url).then(function(responseText) {
            const wrapper = document.createElement('div');
            wrapper.innerHTML = responseText;

            // Look for either #works or #archive sections
            const oldContent = document.querySelector('main > section');
            const newContent = wrapper.querySelector('main > section');

            if(oldContent && newContent) {
                // Update page title
                document.title = wrapper.querySelector('title').textContent;
                
                // Swap content
                document.querySelector('main').appendChild(newContent);
                animate(oldContent, newContent);
            } else {
                // Fallback to regular navigation if sections not found
                window.location.href = url;
            }
        }).catch(function(err) {
            console.error('Error during page transition:', err);
            window.location.href = url; // Fallback to regular navigation
        });
    }

    // Animate transition between pages
    function animate(oldContent, newContent) {
        // Set initial styles for both contents
        oldContent.style.position = 'absolute';
        oldContent.style.width = '100%';
        oldContent.style.top = '0';
        oldContent.style.left = '0';
        oldContent.style.transition = 'opacity 0.4s ease-in-out';
        
        newContent.style.opacity = '0';
        newContent.style.transition = 'opacity 0.4s ease-in-out';
        
        // Force browser reflow
        newContent.offsetHeight;
        
        // Start animation
        oldContent.style.opacity = '0';
        newContent.style.opacity = '1';
        
        // Remove old content after animation
        setTimeout(() => {
            oldContent.parentNode.removeChild(oldContent);
        }, 400);
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
            e.preventDefault();
            history.pushState(null, null, el.href);
            changePage();
        }
    });

})();
