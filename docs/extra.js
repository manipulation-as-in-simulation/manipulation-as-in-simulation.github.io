// Navigation enhancement for gitbook theme with reliable initialization
(function() {
    'use strict';
    
    // Navigation structure
    const navStructure = {
        'stage1-task-scene-construction': [
            { title: 'Overview', anchor: '#overview' },
            { title: 'Kitchen Task Example', anchor: '#kitchen-task-example', children: [
                { title: 'Task Description', anchor: '#task-description' },
                { title: 'Asset Collection', anchor: '#asset-collection' },
                { title: 'Position Measurement', anchor: '#position-measurement' },
                { title: 'Simulation Implementation', anchor: '#simulation-implementation' }
            ]},
            { title: 'Canteen Task Example', anchor: '#canteen-task-example', children: [
                { title: 'Task Description', anchor: '#task-description-1' },
                { title: 'Asset Collection', anchor: '#asset-collection-1' },
                { title: 'Spatial Layout', anchor: '#spatial-layout' }
            ]},
            { title: 'Code Reference', anchor: '#code-reference' },
            { title: 'Next Steps', anchor: '#next-steps' }
        ],
        'stage2-calibration': [
            { title: 'Overview', anchor: '#overview' },
            { title: 'Calibration Workflow', anchor: '#calibration-workflow', children: [
                { title: 'Step 1: Data Collection', anchor: '#step-1-data-collection' },
                { title: 'Step 2: Mask Generation', anchor: '#step-2-mask-generation' },
                { title: 'Step 3: Optimization Solving', anchor: '#step-3-optimization-solving' }
            ]},
            { title: 'Advanced Techniques', anchor: '#advanced-techniques', children: [
                { title: '1. Improving Calibration Accuracy', anchor: '#1-improving-calibration-accuracy' }
            ]},
            { title: 'Code Reference', anchor: '#code-reference' },
            { title: 'Calibration Data Management', anchor: '#calibration-data-management', children: [
                { title: 'Data Organization Structure', anchor: '#data-organization-structure' },
                { title: 'Calibration Result Storage', anchor: '#calibration-result-storage' }
            ]},
            { title: 'Next Steps', anchor: '#next-steps' }
        ],
        'stage3-data-generation': [
            { title: 'Overview', anchor: '#overview', children: [
                { title: 'Hardware Configuration', anchor: '#hardware-configuration' }
            ]},
            { title: 'Data Collection', anchor: '#data-collection' },
            { title: 'Task Decomposition and Annotation', anchor: '#task-decomposition-and-annotation', children: [
                { title: 'Object-Centric Decomposition', anchor: '#object-centric-decomposition' },
                { title: 'Data Generation of Mobile Manipulator', anchor: '#data-generation-of-mobile-manipulator' }
            ]},
            { title: 'Large-scale Data Generation', anchor: '#large-scale-data-generation' },
            { title: 'Dataset Management', anchor: '#dataset-management', children: [
                { title: 'Data Format', anchor: '#data-format' }
            ]},
            { title: 'Code Reference', anchor: '#code-reference' },
            { title: 'Next Steps', anchor: '#next-steps' }
        ],
        'stage4-imitation-learning-deployment': [
            { title: 'Overview', anchor: '#overview' },
            { title: 'Policy Training', anchor: '#policy-training' },
            { title: 'Real-World Deployment', anchor: '#real-world-deployment', children: [
                { title: 'Depth Sensor Denoising', anchor: '#depth-sensor-denoising' }
            ]},
            { title: 'Code Reference', anchor: '#code-reference' }
        ]
    };

    function waitForElement(selector, callback) {
        const element = document.querySelector(selector);
        if (element) {
            callback(element);
            return;
        }
        
        const observer = new MutationObserver((mutations, obs) => {
            const element = document.querySelector(selector);
            if (element) {
                obs.disconnect();
                callback(element);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    function enhanceNavigation() {
        console.log('Enhancing navigation...');
        
        // Clean up any existing enhancements
        document.querySelectorAll('.custom-nav-menu').forEach(el => el.remove());
        
        const chapters = document.querySelectorAll('.summary .chapter[data-path]');
        console.log('Found chapters:', chapters.length);
        
        chapters.forEach(chapter => {
            const link = chapter.querySelector('> a');
            if (!link) return;
            
            const dataPath = chapter.getAttribute('data-path');
            const key = dataPath.replace('/', '');
            const items = navStructure[key];
            
            if (!items || items.length === 0) return;
            
            console.log('Processing:', key);
            
            // Create submenu
            const submenu = document.createElement('ul');
            submenu.className = 'custom-nav-menu';
            submenu.style.cssText = 'margin:0;padding:0;list-style:none;display:none;';
            
            function createMenuItem(item, level = 0) {
                const li = document.createElement('li');
                li.style.cssText = 'margin:0;padding:0;';
                
                const a = document.createElement('a');
                a.href = link.href.split('#')[0] + item.anchor;
                a.textContent = (item.children ? '▸ ' : '') + item.title;
                a.style.cssText = `display:block;padding:5px 5px 5px ${30 + level * 15}px;color:#666;text-decoration:none;font-size:${0.9 - level * 0.05}em;`;
                
                // Hover effect
                a.addEventListener('mouseenter', () => { a.style.color = '#008cff'; });
                a.addEventListener('mouseleave', () => { a.style.color = '#666'; });
                
                li.appendChild(a);
                
                // Add children if exist
                if (item.children) {
                    const childMenu = document.createElement('ul');
                    childMenu.style.cssText = 'margin:0;padding:0;list-style:none;display:none;';
                    
                    item.children.forEach(child => {
                        const childLi = createMenuItem(child, level + 1);
                        childMenu.appendChild(childLi);
                    });
                    
                    li.appendChild(childMenu);
                    
                    // Toggle children
                    a.addEventListener('click', (e) => {
                        e.preventDefault();
                        const isOpen = childMenu.style.display === 'block';
                        childMenu.style.display = isOpen ? 'none' : 'block';
                        a.textContent = (isOpen ? '▸ ' : '▾ ') + item.title;
                        window.location.href = a.href;
                    });
                }
                
                return li;
            }
            
            items.forEach(item => {
                submenu.appendChild(createMenuItem(item));
            });
            
            chapter.appendChild(submenu);
            
            // Make main chapter expandable
            const origClick = link.onclick;
            link.onclick = function(e) {
                const currentPath = window.location.pathname;
                if (currentPath.includes(key)) {
                    e.preventDefault();
                    const isOpen = submenu.style.display === 'block';
                    submenu.style.display = isOpen ? 'none' : 'block';
                    return false;
                }
                if (origClick) return origClick.call(this, e);
            };
            
            // Auto-expand current page
            if (window.location.pathname.includes(key)) {
                submenu.style.display = 'block';
                
                // Highlight current section
                const hash = window.location.hash || '#overview';
                submenu.querySelectorAll('a').forEach(a => {
                    if (a.href.includes(hash)) {
                        a.style.fontWeight = 'bold';
                        a.style.color = '#008cff';
                    }
                });
            }
        });
    }

    // Try multiple initialization strategies
    
    // Strategy 1: Wait for DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(enhanceNavigation, 500);
        });
    } else {
        setTimeout(enhanceNavigation, 500);
    }
    
    // Strategy 2: Wait for gitbook
    window.addEventListener('load', () => {
        setTimeout(enhanceNavigation, 1000);
    });
    
    // Strategy 3: Wait for navigation elements
    waitForElement('.summary .chapter[data-path]', () => {
        setTimeout(enhanceNavigation, 100);
    });
    
    // Strategy 4: Listen for gitbook events
    if (window.gitbook) {
        if (window.gitbook.events) {
            window.gitbook.events.on('page.change', () => {
                setTimeout(enhanceNavigation, 500);
            });
        }
    } else {
        // Wait for gitbook to be available
        let checkGitbook = setInterval(() => {
            if (window.gitbook && window.gitbook.events) {
                clearInterval(checkGitbook);
                window.gitbook.events.on('page.change', () => {
                    setTimeout(enhanceNavigation, 500);
                });
            }
        }, 100);
    }
})();