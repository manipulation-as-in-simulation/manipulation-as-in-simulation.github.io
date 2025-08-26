(function() {
    document.addEventListener('DOMContentLoaded', function() {
        // Process all headers (both main headers and subheaders)
        var headers = document.querySelectorAll('nav .header > a, nav .subheader > a');
        
        headers.forEach(function(header) {
            var parentLi = header.parentElement;
            var nextSibling = parentLi.nextElementSibling;
            var childItems = [];
            
            // Collect child items based on parent type
            if (parentLi.classList.contains('header')) {
                // For main headers, collect until next header or divider
                while (nextSibling && !nextSibling.classList.contains('header') && !nextSibling.classList.contains('divider')) {
                    childItems.push(nextSibling);
                    nextSibling = nextSibling.nextElementSibling;
                }
            } else if (parentLi.classList.contains('subheader')) {
                // For subheaders, collect only subitems
                while (nextSibling && nextSibling.classList.contains('subitem')) {
                    childItems.push(nextSibling);
                    nextSibling = nextSibling.nextElementSibling;
                }
            }
            
            if (childItems.length > 0) {
                // Simply add the arrow as text at the end
                var arrow = document.createTextNode(' ');
                var toggleBtn = document.createElement('span');
                toggleBtn.className = 'nav-collapse-toggle';
                toggleBtn.innerHTML = '▼';
                
                header.appendChild(arrow);
                header.appendChild(toggleBtn);
                
                parentLi.setAttribute('data-collapsed', 'false');
                
                function toggleCollapse(e) {
                    if (e) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                    
                    var isCollapsed = parentLi.getAttribute('data-collapsed') === 'true';
                    
                    if (isCollapsed) {
                        childItems.forEach(function(item) {
                            item.style.display = '';
                            // If it's a subheader that was collapsed, restore its state
                            if (item.classList.contains('subheader')) {
                                var subHeaderState = item.getAttribute('data-collapsed');
                                if (subHeaderState === 'false') {
                                    var subNextSibling = item.nextElementSibling;
                                    while (subNextSibling && subNextSibling.classList.contains('subitem')) {
                                        subNextSibling.style.display = '';
                                        subNextSibling = subNextSibling.nextElementSibling;
                                    }
                                }
                            }
                        });
                        toggleBtn.innerHTML = '▼';
                        parentLi.setAttribute('data-collapsed', 'false');
                    } else {
                        childItems.forEach(function(item) {
                            item.style.display = 'none';
                        });
                        toggleBtn.innerHTML = '▶';
                        parentLi.setAttribute('data-collapsed', 'true');
                    }
                    
                    // Get text without arrow for storage
                    var headerText = header.textContent.replace('▼', '').replace('▶', '').trim();
                    var storageKey = parentLi.classList.contains('header') ? 
                        'nav-collapsed-' + headerText : 
                        'nav-sub-collapsed-' + headerText;
                    localStorage.setItem(storageKey, !isCollapsed);
                }
                
                // Click on arrow toggles
                toggleBtn.addEventListener('click', toggleCollapse);
                
                // Make header clickable but preserve href functionality
                header.style.cursor = 'pointer';
                
                // Check saved state
                var headerText = header.textContent.replace('▼', '').replace('▶', '').trim();
                var storageKey = parentLi.classList.contains('header') ? 
                    'nav-collapsed-' + headerText : 
                    'nav-sub-collapsed-' + headerText;
                var savedState = localStorage.getItem(storageKey);
                if (savedState === 'true') {
                    childItems.forEach(function(item) {
                        item.style.display = 'none';
                    });
                    toggleBtn.innerHTML = '▶';
                    parentLi.setAttribute('data-collapsed', 'true');
                }
            }
        });
        
        // Auto-expand active section
        var currentPath = window.location.pathname;
        var currentHash = window.location.hash;
        
        var allLinks = document.querySelectorAll('nav .summary a');
        allLinks.forEach(function(link) {
            var linkHref = link.getAttribute('href');
            if (!linkHref) return;
            
            // Check if this link is active
            if (currentHash && linkHref.includes(currentHash)) {
                link.classList.add('active');
                
                // Expand parent sections
                var parent = link.parentElement;
                while (parent && parent !== document.body) {
                    // Show the element
                    parent.style.display = '';
                    
                    // If it has a collapsed state, update it
                    if (parent.hasAttribute('data-collapsed')) {
                        parent.setAttribute('data-collapsed', 'false');
                        var toggle = parent.querySelector('.nav-collapse-toggle');
                        if (toggle) {
                            toggle.innerHTML = '▼';
                        }
                    }
                    
                    parent = parent.parentElement;
                }
            }
        });
    });
})();