// Valve's AI Marketing - Main JavaScript File

document.addEventListener('DOMContentLoaded', function() {
    
    // Initialize HTTP client
    const apiClient = createHttpClient('/api'); // Base URL for API calls
    
    // Configure loading callbacks to integrate with UI
    apiClient.onLoadingStart = function(url, config) {
        console.log(`🔄 API Request: ${config.method || 'GET'} ${url}`);
        // Could show global loading indicator here
    };
    
    apiClient.onLoadingEnd = function(url, config) {
        console.log(`✅ API Complete: ${config.method || 'GET'} ${url}`);
        // Could hide global loading indicator here
    };
    
    // Make API client available globally for easy access
    window.apiClient = apiClient;
    
    // Customer data management
    let customers = [];
    let selectedCustomer = null;
    let customersLoaded = false;
    let isLoadingCustomers = false;
    
    // Fetch customers from the webhook endpoint
    async function fetchCustomers() {
        if (isLoadingCustomers || customersLoaded) {
            return customers;
        }
        
        try {
            isLoadingCustomers = true;
            console.log('🔄 Fetching customers...');
            
            // Show loading state in dropdown
            showLoadingState();
            
            // Create a client specifically for the webhook endpoint
            const webhookClient = createHttpClient('https://hook.eu1.make.com');
            
            console.log('📡 Calling webhook endpoint...');
            const response = await webhookClient.get('/s6a1sewxzui7n7ygf1lb3hltfpfxhham');
            console.log('📥 Raw response:', response);
            console.log('📥 Response type:', typeof response);
            
            // Parse the response - handle different response types
            let customerData = [];
            let textData = '';
            
            try {
                // Handle Blob response (convert to text)
                if (response && typeof response === 'object' && response.constructor?.name === 'Blob') {
                    console.log('🔄 Converting Blob to text...');
                    textData = await response.text();
                    console.log('📝 Blob text content:', textData);
                } else if (typeof response === 'string') {
                    textData = response;
                } else if (Array.isArray(response)) {
                    customerData = response;
                } else if (response && typeof response === 'object') {
                    customerData = [response];
                } else {
                    throw new Error('Invalid response format: ' + typeof response);
                }
                
                // Parse text data as JSONL if we have it
                if (textData && customerData.length === 0) {
                    console.log('🔄 Parsing JSONL data...');
                    // Split by lines and parse each JSON object
                    const lines = textData.trim().split('\n').filter(line => line.trim());
                    console.log('📝 Found lines:', lines.length);
                    
                    customerData = lines.map((line, index) => {
                        try {
                            const parsed = JSON.parse(line.trim());
                            console.log(`✅ Parsed line ${index + 1}:`, parsed);
                            return parsed;
                        } catch (parseError) {
                            console.warn(`❌ Failed to parse line ${index + 1}:`, line, parseError);
                            return null;
                        }
                    }).filter(item => item !== null);
                }
                
                // Validate and map customer data
                customers = customerData.map(customer => {
                    if (!customer || typeof customer !== 'object') {
                        console.warn('Invalid customer data:', customer);
                        return null;
                    }
                    
                    return {
                        id: customer.id || Math.random().toString(36),
                        name: customer.company_name || customer.name || 'Unknown Company',
                        website: customer.website || customer.url || 'No website'
                    };
                }).filter(customer => customer !== null);
                
                if (customers.length === 0) {
                    throw new Error('No valid customer data found in response');
                }
                
            } catch (parseError) {
                console.error('Error parsing customer data:', parseError);
                throw new Error('Failed to parse customer data: ' + parseError.message);
            }
            
            customersLoaded = true;
            console.log('✅ Customers loaded:', customers);
            
            // Update the dropdown UI
            updateCustomerDropdown();
            
            return customers;
            
        } catch (error) {
            console.error('❌ Error fetching customers:', error);
            showErrorState(error.message);
            return [];
        } finally {
            isLoadingCustomers = false;
        }
    }
    
    // Show loading state in dropdown
    function showLoadingState() {
        const dropdownMenu = document.getElementById('dropdownMenu');
        dropdownMenu.innerHTML = `
            <div class="dropdown-header">
                <span>Loading Customers...</span>
            </div>
            <div class="dropdown-loading">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
                <p class="loading-text">Fetching customer data...</p>
                <p class="loading-subtext">Please wait a moment</p>
            </div>
        `;
    }
    
    // Show error state in dropdown
    function showErrorState(errorMessage) {
        const dropdownMenu = document.getElementById('dropdownMenu');
        dropdownMenu.innerHTML = `
            <div class="dropdown-header">
                <span>Error Loading Customers</span>
            </div>
            <div class="dropdown-error">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <p class="error-text">Failed to load customers</p>
                <p class="error-subtext">${errorMessage}</p>
                <button class="retry-btn" onclick="retryLoadCustomers()">
                    <i class="fas fa-redo"></i> Try Again
                </button>
            </div>
            <div class="dropdown-divider"></div>
            <div class="dropdown-item add-customer" id="addCustomerBtn" 
                 role="option" 
                 tabindex="0" 
                 aria-label="Add a new customer">
                <div class="dropdown-item-icon">
                    <i class="fas fa-plus"></i>
                </div>
                <div class="dropdown-item-content">
                    <span class="dropdown-item-title">Add a new customer</span>
                    <span class="dropdown-item-subtitle">Create a new customer profile</span>
                </div>
            </div>
        `;
        
        // Re-attach event listener for add customer button
        const newAddCustomerBtn = document.getElementById('addCustomerBtn');
        if (newAddCustomerBtn) {
            newAddCustomerBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                handleAddCustomer();
                closeDropdown();
            });
        }
    }
    
    // Retry loading customers
    window.retryLoadCustomers = function() {
        customersLoaded = false;
        isLoadingCustomers = false;
        fetchCustomers();
    };
    
    // Update the customer dropdown with fetched data
    function updateCustomerDropdown() {
        const dropdownMenu = document.getElementById('dropdownMenu');
        
        // Build the new dropdown content
        let dropdownHTML = `
            <div class="dropdown-header">
                <span>Select Customer (${customers.length})</span>
            </div>
        `;
        
        if (customers.length === 0) {
            // Show empty state
            dropdownHTML += `
                <div class="dropdown-empty">
                    <div class="empty-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <p class="empty-text">No customers found</p>
                    <p class="empty-subtext">Add your first customer to get started</p>
                </div>
            `;
        } else {
            // Add customer items by creating elements properly
            dropdownMenu.innerHTML = dropdownHTML;
            
            customers.forEach(customer => {
                const customerItem = document.createElement('div');
                customerItem.className = 'dropdown-item customer-item';
                customerItem.setAttribute('data-customer-id', customer.id);
                customerItem.innerHTML = `
                    <div class="dropdown-item-icon">
                        <i class="fas fa-building"></i>
                    </div>
                    <div class="dropdown-item-content">
                        <span class="dropdown-item-title">${escapeHtml(customer.name)}</span>
                        <span class="dropdown-item-subtitle">${escapeHtml(customer.website)}</span>
                    </div>
                `;
                
                // Add click handler
                customerItem.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    selectCustomer(customer);
                });
                
                dropdownMenu.appendChild(customerItem);
            });
            
            // Add divider and "Add new customer" option
            const divider = document.createElement('div');
            divider.className = 'dropdown-divider';
            dropdownMenu.appendChild(divider);
            
            const addCustomerItem = document.createElement('div');
            addCustomerItem.className = 'dropdown-item add-customer';
            addCustomerItem.id = 'addCustomerBtn';
            addCustomerItem.setAttribute('role', 'option');
            addCustomerItem.setAttribute('tabindex', '0');
            addCustomerItem.setAttribute('aria-label', 'Add a new customer');
            addCustomerItem.innerHTML = `
                <div class="dropdown-item-icon">
                    <i class="fas fa-plus"></i>
                </div>
                <div class="dropdown-item-content">
                    <span class="dropdown-item-title">Add a new customer</span>
                    <span class="dropdown-item-subtitle">Create a new customer profile</span>
                </div>
            `;
            
            // Add click handler for add customer
            addCustomerItem.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                handleAddCustomer();
                closeDropdown();
            });
            
            dropdownMenu.appendChild(addCustomerItem);
            return;
        }
        
        // For empty state, complete the HTML and set it
        dropdownHTML += `
            <div class="dropdown-divider"></div>
            <div class="dropdown-item add-customer" id="addCustomerBtn" 
                 role="option" 
                 tabindex="0" 
                 aria-label="Add a new customer">
                <div class="dropdown-item-icon">
                    <i class="fas fa-plus"></i>
                </div>
                <div class="dropdown-item-content">
                    <span class="dropdown-item-title">Add a new customer</span>
                    <span class="dropdown-item-subtitle">Create a new customer profile</span>
                </div>
            </div>
        `;
        
        dropdownMenu.innerHTML = dropdownHTML;
        
        // Re-attach event listener for add customer button
        const newAddCustomerBtn = document.getElementById('addCustomerBtn');
        if (newAddCustomerBtn) {
            newAddCustomerBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                handleAddCustomer();
                closeDropdown();
            });
        }
    }
    
    // Helper function to escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Handle customer selection
    function selectCustomer(customer) {
        selectedCustomer = customer;
        
        // Update the dropdown trigger to show selected customer
        const dropdownLabel = document.querySelector('.dropdown-label');
        const dropdownSublabel = document.querySelector('.dropdown-sublabel');
        
        dropdownLabel.textContent = customer.name;
        dropdownSublabel.textContent = customer.website;
        
        // Close dropdown
        closeDropdown();
        
        // Show success notification
        showNotification(`Selected customer: ${customer.name}`, 'success');
        
        console.log('✅ Customer selected:', customer);
    }
    
    // Initialize dropdown with default state
    function initializeDropdown() {
        const dropdownMenu = document.getElementById('dropdownMenu');
        dropdownMenu.innerHTML = `
            <div class="dropdown-header">
                <span>Recent Customers</span>
            </div>
            <div class="dropdown-empty">
                <div class="empty-icon">
                    <i class="fas fa-cloud-download-alt"></i>
                </div>
                <p class="empty-text">Click to load customers</p>
                <p class="empty-subtext">Customer data will be fetched when you open this dropdown</p>
            </div>
            <div class="dropdown-divider"></div>
            <div class="dropdown-item add-customer" id="addCustomerBtn" 
                 role="option" 
                 tabindex="0" 
                 aria-label="Add a new customer">
                <div class="dropdown-item-icon">
                    <i class="fas fa-plus"></i>
                </div>
                <div class="dropdown-item-content">
                    <span class="dropdown-item-title">Add a new customer</span>
                    <span class="dropdown-item-subtitle">Create a new customer profile</span>
                </div>
            </div>
        `;
        
        // Attach event listener for add customer button
        const addCustomerBtn = document.getElementById('addCustomerBtn');
        if (addCustomerBtn) {
            addCustomerBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                handleAddCustomer();
                closeDropdown();
            });
        }
    }
    
    // Initialize dropdown with default empty state
    initializeDropdown();
    
    // Demo function for testing HTTP client (callable from browser console)
    window.testHttpClient = async function() {
        console.log('🧪 Testing HTTP Client...');
        
        try {
            // Test with a public API (JSONPlaceholder)
            const testClient = createHttpClient('https://jsonplaceholder.typicode.com');
            
            console.log('📡 Testing GET request...');
            const users = await testClient.get('/users?_limit=3');
            console.log('✅ GET Success:', users);
            
            console.log('📡 Testing POST request...');
            const newPost = await testClient.post('/posts', {
                title: 'Test from Valve AI Marketing',
                body: 'This is a test post from our HTTP client',
                userId: 1
            });
            console.log('✅ POST Success:', newPost);
            
            showNotification('HTTP Client test completed! Check console for details.', 'success');
            
        } catch (error) {
            console.error('❌ HTTP Client test failed:', error);
            showNotification('HTTP Client test failed: ' + error.message, 'error');
        }
    };
    
    // Customer dropdown functionality
    const customerDropdown = document.getElementById('customerDropdown');
    const dropdownTrigger = document.getElementById('dropdownTrigger');
    const dropdownMenu = document.getElementById('dropdownMenu');
    const addCustomerBtn = document.getElementById('addCustomerBtn');
    
    // Toggle dropdown
    dropdownTrigger.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const isOpen = customerDropdown.classList.contains('open');
        
        if (isOpen) {
            closeDropdown();
        } else {
            openDropdown();
        }
    });
    
    // Add customer button
    addCustomerBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        handleAddCustomer();
        closeDropdown();
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!customerDropdown.contains(e.target)) {
            closeDropdown();
        }
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeDropdown();
        }
    });
    
    function openDropdown() {
        customerDropdown.classList.add('open');
        dropdownTrigger.setAttribute('aria-expanded', 'true');
        dropdownMenu.setAttribute('aria-hidden', 'false');
        
        // Load customers when dropdown opens (lazy loading)
        if (!customersLoaded && !isLoadingCustomers) {
            fetchCustomers();
        }
        
        // Focus first interactive element
        setTimeout(() => {
            const firstFocusable = dropdownMenu.querySelector('.dropdown-item');
            if (firstFocusable) {
                firstFocusable.focus();
            }
        }, 100);
    }
    
    function closeDropdown() {
        customerDropdown.classList.remove('open');
        dropdownTrigger.setAttribute('aria-expanded', 'false');
        dropdownMenu.setAttribute('aria-hidden', 'true');
    }
    
    async function handleAddCustomer() {
        try {
            // Show immediate feedback
            showNotification('Opening customer creation...', 'info');
            
            // Example API call using our HTTP client
            // This would be replaced with actual customer creation logic
            
            // Simulate API call for demonstration
            const demoCustomerData = {
                name: 'Demo Customer',
                email: 'demo@example.com',
                industry: 'Technology'
            };
            
            // Example of how we'll use the HTTP client:
            /*
            const newCustomer = await apiClient.post('/customers', demoCustomerData);
            showNotification(`Customer "${newCustomer.name}" created successfully!`, 'success');
            */
            
            // For now, just simulate the API call
            console.log('🧪 Demo: Would call apiClient.post("/customers", data)');
            console.log('📝 Customer data:', demoCustomerData);
            
            // Simulate success
            setTimeout(() => {
                showNotification('Customer creation functionality ready for API integration!', 'success');
            }, 800);
            
        } catch (error) {
            console.error('Error creating customer:', error);
            showNotification('Error creating customer: ' + error.message, 'error');
        }
    }
    
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
        const stepBtn = step.querySelector('.step-btn');
        const expandBtn = step.querySelector('.expand-btn');
        const stepHeader = step.querySelector('.step-header');
        
        // Add click handler for step action buttons
        stepBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const functionType = step.getAttribute('data-function');
            handleStepAction(functionType, step);
        });
        
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
        
        // Prevent step button from triggering expand
        stepBtn.addEventListener('click', function(e) {
            e.stopPropagation();
        });
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

    // Handle step action button clicks
    function handleStepAction(functionType, stepElement) {
        // Add loading state
        const btn = stepElement.querySelector('.step-btn');
        const originalText = btn.textContent;
        btn.textContent = 'Loading...';
        btn.disabled = true;
        
        // Add visual feedback
        stepElement.style.borderColor = 'var(--primary-blue)';
        stepElement.style.boxShadow = 'var(--shadow-xl)';
        
        // Simulate API call or navigation
        setTimeout(() => {
            // Reset button state
            btn.textContent = originalText;
            btn.disabled = false;
            stepElement.style.borderColor = '';
            stepElement.style.boxShadow = '';
            
            // Show success feedback
            const stepNumber = stepElement.getAttribute('data-step');
            const stepTitle = stepElement.querySelector('.step-title').textContent;
            showNotification(`Step ${stepNumber}: ${stepTitle} - Module will be available soon!`, 'info');
        }, 1000);
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
