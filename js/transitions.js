(function() {
    // Don't run transitions if using file:// protocol
    if (window.location.protocol === 'file:') {
        console.warn('Page transitions require serving files from a web server.');
        return;
    }

    console.log('Transitions.js initialized');

    // Cache for storing fetched pages
    const cache = {};

    // Initialize plugins after DOM updates
    function initPlugins() {
        // Destroy existing sticky instances first
        $('.sticky').each(function() {
            $(this).data('plugin_typeSticky', null);
        });
        
        // Reinitialize sticky elements
        if (typeof $.fn.typeSticky === 'function') {
            setTimeout(() => {
                $('.sticky').typeSticky();
            }, 100); // Small delay to ensure DOM is ready
        }
    }

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
        const scrollPos = window.scrollY;

        loadPage(url).then(function(responseText) {
            const wrapper = document.createElement('div');
            wrapper.innerHTML = responseText;

            const oldContent = document.querySelector('main > section');
            let newContent = wrapper.querySelector('main > section');

            if(oldContent && newContent) {
                // Update page title
                document.title = wrapper.querySelector('title').textContent;
                
                // Set up transition
                oldContent.style.opacity = '1';
                newContent.style.opacity = '0';
                
                // Add new content to DOM
                oldContent.parentNode.appendChild(newContent);
                
                // Force reflow
                newContent.offsetHeight;
                
                // Start transition
                requestAnimationFrame(() => {
                    oldContent.style.transition = 'opacity 0.4s ease-in-out';
                    newContent.style.transition = 'opacity 0.4s ease-in-out';
                    
                    oldContent.style.opacity = '0';
                    newContent.style.opacity = '1';
                    
                    // Clean up and reinitialize
                    setTimeout(() => {
                        oldContent.remove();
                        window.scrollTo(0, scrollPos);
                        initPlugins();
                    }, 400);
                });
            } else {
                window.location.href = url;
            }
        }).catch(function(err) {
            console.error('Error during page transition:', err);
            window.location.href = url;
        });
    }

    // Listen for back/forward navigation
    window.addEventListener('popstate', changePage);

    // Handle link clicks
    document.addEventListener('click', function(e) {
        let el = e.target;

        while (el && !el.href) {
            el = el.parentNode;
        }

        if (el && el.href && el.href.indexOf(window.location.origin) === 0) {
            e.preventDefault();
            history.pushState(null, null, el.href);
            changePage();
        }
    });

    // Initial plugins setup
    $(document).ready(initPlugins);

})();
