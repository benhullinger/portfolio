(function() {
    if (window.location.protocol === 'file:') {
        console.warn('Page transitions require serving files from a web server.');
        return;
    }

    const cache = {};
    
    // Check if user is authenticated by looking for the nf_jwt cookie
    function isAuthenticated() {
        return document.cookie.split(';').some(item => item.trim().startsWith('nf_jwt='));
    }

    // Check if a URL points to protected content
    function isProtectedContent(url) {
        return url.includes('/pro/');
    }

    function loadPage(url) {
        if (cache[url]) {
            return Promise.resolve(cache[url]);
        }
        return fetch(url, {
            method: 'GET',
            credentials: 'same-origin' // Important for sending cookies
        }).then(function(response) {
            // Handle various authentication scenarios
            if (response.url.includes('login') || response.url !== url) {
                if (!isAuthenticated() && isProtectedContent(url)) {
                    window.location.href = url; // Let regular navigation handle the redirect
                    return Promise.reject('Unauthorized');
                }
            }
            cache[url] = response.text();
            return cache[url];
        });
    }

    function updateHeader(newDocument) {
        // Update the logo link
        const currentLogo = document.querySelector('#header h1 > a');
        const newLogo = newDocument.querySelector('#header h1 > a');
        if (currentLogo && newLogo) {
            currentLogo.href = newLogo.href;
            currentLogo.title = newLogo.title;
        }
    }

    function changePage() {
        const url = window.location.href;
        const scrollPos = window.scrollY;

        loadPage(url).then(function(responseText) {
            const wrapper = document.createElement('div');
            wrapper.innerHTML = responseText;

            // Update header links
            updateHeader(wrapper);

            const oldContent = document.querySelector('main > section');
            const newContent = wrapper.querySelector('main > section');

            if(oldContent && newContent) {
                // Update page title
                document.title = wrapper.querySelector('title').textContent;
                
                // Set up fade transition
                newContent.style.opacity = '0';
                document.querySelector('main').appendChild(newContent);
                
                // Execute transition
                requestAnimationFrame(() => {
                    oldContent.style.transition = 'opacity 0.4s ease-in-out';
                    newContent.style.transition = 'opacity 0.4s ease-in-out';
                    
                    oldContent.style.opacity = '0';
                    newContent.style.opacity = '1';
                    
                    setTimeout(() => {
                        oldContent.remove();
                        window.scrollTo(0, scrollPos);
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

    // Event listeners
    window.addEventListener('popstate', changePage);
    
    // Modified event listener to handle protected content
    document.addEventListener('click', function(e) {
        let el = e.target;
        while (el && !el.href) {
            el = el.parentNode;
        }
        if (el && el.href && el.href.indexOf(window.location.origin) === 0) {
            // Check if this is a protected page
            const isProtected = el.querySelector('.lock-icon') || isProtectedContent(el.href);
            
            // If it's protected content and user is not authenticated, let default navigation handle it
            if (isProtected && !isAuthenticated()) {
                return;
            }
            
            e.preventDefault();
            history.pushState(null, null, el.href);
            changePage();
        }
    });
})();
