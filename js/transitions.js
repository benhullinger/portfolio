(function() {

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

            const oldContent = document.querySelector('#archive');
            const newContent = wrapper.querySelector('#archive');

            if(oldContent && newContent) {
                document.querySelector('main').appendChild(newContent);
                animate(oldContent, newContent);
            }
        });
    }

    // Animate transition between pages
    function animate(oldContent, newContent) {
        oldContent.style.position = 'absolute';
        oldContent.style.width = '100%';

        const fadeOut = oldContent.animate({
            opacity: [1, 0]
        }, 400);

        const fadeIn = newContent.animate({
            opacity: [0, 1]  
        }, 400);

        fadeIn.onfinish = function() {
            oldContent.parentNode.removeChild(oldContent);
        };
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
