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
        // Try cache first
        if (cache[url]) {
            console.log('Using cached version:', url);
            return Promise.resolve(cache[url]);
        }

        console.log('Loading page:', url, 'Auth status:', isAuthenticated());

        return fetch(url, {
            method: 'GET',
            credentials: 'same-origin',
            headers: {
                'Accept': 'text/html'
            }
        }).then(function(response) {
            // Debug logging
            console.log('Response URL:', response.url, 'Original URL:', url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // If we're authenticated and got redirected, try a direct fetch
            if (response.url !== url && isAuthenticated() && isProtectedContent(url)) {
                console.log('Authenticated redirect detected, trying direct fetch');
                return fetch(url, {
                    method: 'GET',
                    credentials: 'same-origin',
                    headers: {
                        'Accept': 'text/html',
                        'Cookie': document.cookie // Explicitly send cookies
                    }
                }).then(r => r.text());
            }
            
            // Handle other redirects
            if (response.url !== url) {
                window.location.href = url;
                return Promise.reject('Redirect detected');
            }

            return response.text();
        }).then(text => {
            cache[url] = text;
            return text;
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
            const url = el.href;
            const isProtected = el.querySelector('.lock-icon') || isProtectedContent(url);
            
            // Debug logging
            console.log('Click detected:', url, 'Protected:', isProtected, 'Auth:', isAuthenticated());
            
            // Don't prevent default for protected content without auth
            if (isProtected && !isAuthenticated()) {
                return;
            }
            
            e.preventDefault();
            history.pushState(null, null, url);
            changePage();
        }
    });

    // Initialize transitions after login if needed
    if (isAuthenticated() && isProtectedContent(window.location.href)) {
        // Force initial page into cache
        loadPage(window.location.href).catch(console.error);
    }
})();
