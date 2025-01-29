(function() {
    if (window.location.protocol === 'file:') {
        console.warn('Page transitions require serving files from a web server.');
        return;
    }

    const cache = {};
    
    // Update authentication check to look for our new cookie
    function isAuthenticated() {
        return document.cookie.split(';').some(item => 
            item.trim().startsWith('auth_status=true')
        );
    }

    // Check if a URL points to protected content
    function isProtectedContent(url) {
        return url.includes('/pro/');
    }

    // Handle navigation based on authentication status
    function handleNavigation(url, isProtected) {
        if (isProtected) {
            // For protected content, check authentication before proceeding
            if (isAuthenticated()) {
                return true;
            } else {
                window.location.href = url;
                return false;
            }
        }
        return true; // Allow transitions for non-protected content
    }

    function loadPage(url) {
        if (cache[url]) {
            return Promise.resolve(cache[url]);
        }

        return fetch(url, {
            method: 'GET',
            credentials: 'same-origin',
            headers: {
                'Accept': 'text/html',
                'Cache-Control': 'no-cache'
            }
        }).then(function(response) {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            if (response.url !== url && isAuthenticated() && isProtectedContent(url)) {
                return fetch(url, {
                    method: 'GET',
                    credentials: 'same-origin',
                    headers: {
                        'Accept': 'text/html',
                        'Cookie': document.cookie
                    }
                }).then(r => r.text());
            }
            
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

    function isAnchorOrLightboxUrl(url) {
        // Only consider it a lightbox URL if it has both gid and pid parameters
        const isLightboxHash = url.includes('#&gid=') && url.includes('&pid=');
        
        // Get current path without hash
        const currentPath = window.location.pathname;
        const newPath = new URL(url, window.location.origin).pathname;
        
        // It's an anchor link if it's the same page and has a hash that isn't a lightbox hash
        const isAnchorLink = currentPath === newPath && 
                            url.includes('#') && 
                            !isLightboxHash;
        
        return isAnchorLink || isLightboxHash;
    }

    function isLightboxTransition() {
        return (
            window._isLightboxTransition ||
            (window.location.hash && window.location.hash.includes('&gid=') && window.location.hash.includes('&pid=')) ||
            document.querySelector('.pswp--open')
        );
    }

    function changePage() {
        const url = window.location.href;
        
        // Only skip transitions for actual lightbox operations
        if (isLightboxTransition()) {
            return;
        }

        // Skip transition only for pure anchor links or lightbox URLs
        if (isAnchorOrLightboxUrl(url)) {
            return;
        }

        const scrollPos = window.scrollY;
        
        // Check if lightbox is open
        const lightboxOpen = document.querySelector('.pswp--open');
        if (lightboxOpen) {
            return; // Don't perform page transition if lightbox is open
        }

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
                        
                        // Reinitialize lightbox if the function exists
                        if (typeof initDunkedLightbox === 'function') {
                            initDunkedLightbox('.gallery');
                        }
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
    
    // Helper function to check if an element or its parents have a class
    function hasClassInTree(element, className) {
        while (element) {
            if (element.classList && element.classList.contains(className)) {
                return true;
            }
            element = element.parentElement;
        }
        return false;
    }

    // Helper to determine if element is part of lightbox UI
    function isLightboxElement(el) {
        return hasClassInTree(el, 'gallery') ||
               hasClassInTree(el, 'pswp') ||
               hasClassInTree(el, 'view') ||
               el.closest('[data-size]') !== null;
    }

    // Helper to determine if element is part of navigation
    function isNavElement(el) {
        return hasClassInTree(el, 'details') ||
               el.tagName === 'SUMMARY' ||
               hasClassInTree(el, 'arrow');
    }

    // Modified event listener to handle all interaction types
    document.addEventListener('click', function(e) {
        let el = e.target;

        // Handle navigation dropdown clicks
        if (isNavElement(el)) {
            return; // Let the native behavior handle it
        }

        // Handle lightbox clicks
        if (isLightboxElement(el)) {
            return; // Let the lightbox handle it
        }

        // Find closest anchor tag
        while (el && !el.href) {
            el = el.parentNode;
        }

        if (el && el.href && el.href.indexOf(window.location.origin) === 0) {
            // Don't handle lightbox-related clicks
            if (isLightboxTransition() || isLightboxElement(el)) {
                return;
            }

            // Don't handle anchor links or lightbox URLs
            if (isAnchorOrLightboxUrl(el.href)) {
                return;
            }

            const url = el.href;
            const isProtected = el.querySelector('.lock-icon') || isProtectedContent(url);
            
            if (!handleNavigation(url, isProtected)) {
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
