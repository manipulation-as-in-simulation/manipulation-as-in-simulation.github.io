(function() {
    document.addEventListener('DOMContentLoaded', function() {
        var navToggle = document.getElementById('nav-toggle');
        var bookSummary = document.querySelector('.book-summary');
        var bookBody = document.querySelector('.book-body');
        var overlay = document.getElementById('nav-overlay');
        
        if (!navToggle) return;
        
        function isMobile() {
            return window.innerWidth <= 768;
        }
        
        function toggleNav() {
            if (isMobile()) {
                bookSummary.classList.toggle('nav-open');
                bookBody.classList.toggle('nav-open');
                overlay.classList.toggle('show');
                
                if (bookSummary.classList.contains('nav-open')) {
                    navToggle.innerHTML = '✕';
                } else {
                    navToggle.innerHTML = '☰';
                }
            } else {
                bookSummary.classList.toggle('nav-collapsed');
                bookBody.classList.toggle('nav-collapsed');
                navToggle.classList.toggle('nav-collapsed');
                
                if (bookSummary.classList.contains('nav-collapsed')) {
                    navToggle.innerHTML = '☰';
                    navToggle.title = 'Show Navigation';
                } else {
                    navToggle.innerHTML = '◀';
                    navToggle.title = 'Hide Navigation';
                }
            }
            
            localStorage.setItem('navCollapsed', bookSummary.classList.contains('nav-collapsed') || bookSummary.classList.contains('nav-open'));
        }
        
        navToggle.addEventListener('click', toggleNav);
        
        if (overlay) {
            overlay.addEventListener('click', function() {
                if (isMobile() && bookSummary.classList.contains('nav-open')) {
                    toggleNav();
                }
            });
        }
        
        var navState = localStorage.getItem('navCollapsed');
        if (navState === 'true' && !isMobile()) {
            bookSummary.classList.add('nav-collapsed');
            bookBody.classList.add('nav-collapsed');
            navToggle.classList.add('nav-collapsed');
            navToggle.innerHTML = '☰';
            navToggle.title = 'Show Navigation';
        } else if (!isMobile()) {
            navToggle.innerHTML = '◀';
            navToggle.title = 'Hide Navigation';
        } else {
            navToggle.innerHTML = '☰';
        }
        
        window.addEventListener('resize', function() {
            if (!isMobile()) {
                bookSummary.classList.remove('nav-open');
                bookBody.classList.remove('nav-open');
                overlay.classList.remove('show');
                
                if (bookSummary.classList.contains('nav-collapsed')) {
                    navToggle.innerHTML = '☰';
                    navToggle.title = 'Show Navigation';
                } else {
                    navToggle.innerHTML = '◀';
                    navToggle.title = 'Hide Navigation';
                }
            } else {
                bookSummary.classList.remove('nav-collapsed');
                bookBody.classList.remove('nav-collapsed');
                navToggle.classList.remove('nav-collapsed');
                navToggle.innerHTML = '☰';
            }
        });
    });
})();