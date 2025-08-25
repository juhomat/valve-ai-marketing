// Valve's AI Marketing - Simplified Main JavaScript File

document.addEventListener('DOMContentLoaded', function() {
    
    // Initialize HTTP client for general use
    const apiClient = createHttpClient('/api');
    apiClient.onLoadingStart = function(url, config) {
        console.log(`🔄 API Request: ${config.method || 'GET'} ${url}`);
    };
    apiClient.onLoadingEnd = function(url, config) {
        console.log(`✅ API Complete: ${config.method || 'GET'} ${url}`);
    };
    window.apiClient = apiClient;
    
    // Demo function for testing HTTP client
    window.testHttpClient = async function() {
        console.log('🧪 Testing HTTP Client...');
        try {
            const testClient = createHttpClient('https://jsonplaceholder.typicode.com');
            const users = await testClient.get('/users?_limit=3');
            console.log('✅ GET Success:', users);
            showNotification('HTTP Client test completed! Check console for details.', 'success');
        } catch (error) {
            console.error('❌ HTTP Client test failed:', error);
            showNotification('HTTP Client test failed: ' + error.message, 'error');
        }
    };
    
    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });

    // Step interactions
    const stepItems = document.querySelectorAll('.step-item');
    
    stepItems.forEach(step => {
        const expandBtn = step.querySelector('.expand-btn');
        const stepHeader = step.querySelector('.step-header');
        
        // Add click handler for expand buttons and headers
        function toggleStep(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const isExpanded = step.classList.contains('expanded');
            
            // Close all other steps
            stepItems.forEach(otherStep => {
                if (otherStep !== step) {
                    otherStep.classList.remove('expanded');
                }
            });
            
            // Toggle current step
            if (isExpanded) {
                step.classList.remove('expanded');
            } else {
                step.classList.add('expanded');
                
                // Scroll to step after expansion animation
                setTimeout(() => {
                    step.scrollIntoView({
                        behavior: 'smooth',
                        block: 'nearest'
                    });
                }, 150);
            }
        }
        
        expandBtn.addEventListener('click', toggleStep);
        stepHeader.addEventListener('click', toggleStep);
    });

    // Navigation active state
    function updateActiveNav() {
        const currentPath = window.location.hash || '#dashboard';
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === currentPath) {
                link.classList.add('active');
            }
        });
    }



    // Keyboard navigation for steps
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            // Close all expanded steps
            stepItems.forEach(step => {
                step.classList.remove('expanded');
            });
        }
    });

    // Add accessibility support
    stepItems.forEach((step, index) => {
        const expandBtn = step.querySelector('.expand-btn');
        const stepHeader = step.querySelector('.step-header');
        
        // Add ARIA attributes
        expandBtn.setAttribute('aria-expanded', 'false');
        expandBtn.setAttribute('aria-controls', `step-content-${index + 1}`);
        
        const stepContent = step.querySelector('.step-content');
        stepContent.setAttribute('id', `step-content-${index + 1}`);
        stepContent.setAttribute('aria-hidden', 'true');
        
        // Update ARIA attributes when expanding/collapsing
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const isExpanded = step.classList.contains('expanded');
                    expandBtn.setAttribute('aria-expanded', isExpanded.toString());
                    stepContent.setAttribute('aria-hidden', (!isExpanded).toString());
                }
            });
        });
        
        observer.observe(step, { attributes: true });
    });

    // Notification system
    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-info-circle"></i>
                <span>${message}</span>
                <button class="notification-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 16px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            max-width: 400px;
            animation: slideIn 0.3s ease;
        `;
        
        const content = notification.querySelector('.notification-content');
        content.style.cssText = `
            display: flex;
            align-items: center;
            gap: 12px;
            color: #374151;
        `;
        
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.style.cssText = `
            background: none;
            border: none;
            cursor: pointer;
            color: #9ca3af;
            margin-left: auto;
        `;
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Close functionality
        closeBtn.addEventListener('click', () => {
            notification.remove();
        });
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    // Add CSS animation for notifications
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);

    // Stats animation on scroll
    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px 0px -100px 0px'
    };

    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateStats();
                statsObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const statsSection = document.querySelector('.stats-section');
    if (statsSection) {
        statsObserver.observe(statsSection);
    }

    function animateStats() {
        const statNumbers = document.querySelectorAll('.stat-number');
        statNumbers.forEach(stat => {
            const finalValue = stat.textContent;
            const isPercentage = finalValue.includes('%');
            const isMultiplier = finalValue.includes('x');
            const isNumber = finalValue.includes('+');
            
            let numericValue = parseFloat(finalValue);
            let currentValue = 0;
            const increment = numericValue / 50; // 50 frames animation
            
            const timer = setInterval(() => {
                currentValue += increment;
                if (currentValue >= numericValue) {
                    currentValue = numericValue;
                    clearInterval(timer);
                }
                
                let displayValue = Math.floor(currentValue);
                if (isPercentage) {
                    stat.textContent = displayValue + '%';
                } else if (isMultiplier) {
                    stat.textContent = currentValue.toFixed(1) + 'x';
                } else if (isNumber) {
                    stat.textContent = displayValue + '+';
                } else {
                    stat.textContent = displayValue;
                }
            }, 20);
        });
    }

    // Initialize
    updateActiveNav();
    
    // Handle hash changes
    window.addEventListener('hashchange', updateActiveNav);

    // Add loading states for future AJAX calls
    window.showLoading = function(element) {
        element.style.opacity = '0.6';
        element.style.pointerEvents = 'none';
    };

    window.hideLoading = function(element) {
        element.style.opacity = '1';
        element.style.pointerEvents = 'auto';
    };

    console.log('Valve AI Marketing application initialized successfully!');
});
