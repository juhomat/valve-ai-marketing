// Simple Customer Dropdown Implementation
// Clean, robust solution that works with the known webhook format

class CustomerDropdown {
    constructor() {
        this.customers = [];
        this.selectedCustomer = null;
        this.isOpen = false;
        this.isLoading = false;
        this.loaded = false;
        this.statusRefreshTimer = null;
        
        this.initElements();
        this.bindEvents();
        this.loadFromCookie();
        this.render();
    }
    
    initElements() {
        this.trigger = document.getElementById('customerTrigger');
        this.menu = document.getElementById('customerMenu');
        this.dropdown = this.trigger.closest('.simple-customer-dropdown');
        this.selectedSpan = this.trigger.querySelector('.selected-customer');
        this.hintSpan = this.trigger.querySelector('.trigger-hint');
        
        // Header elements
        this.headerCustomer = document.getElementById('headerCustomer');
        this.headerCustomerName = document.getElementById('headerCustomerName');
        this.headerCustomerWebsite = document.getElementById('headerCustomerWebsite');
        this.changeCustomerBtn = document.getElementById('changeCustomerBtn');
        
        // Step 1 elements
        this.indexWebsiteBtn = document.getElementById('indexWebsiteBtn');
    }
    
    bindEvents() {
        this.trigger.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggle();
        });
        
        document.addEventListener('click', (e) => {
            if (!this.dropdown.contains(e.target)) {
                this.close();
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.close();
            }
        });
        
        // Change customer button in header
        if (this.changeCustomerBtn) {
            this.changeCustomerBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.scrollToDropdown();
                this.open();
            });
        }
        
        // Index website button
        if (this.indexWebsiteBtn) {
            this.indexWebsiteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleIndexWebsite();
            });
        }
    }
    
    async toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            await this.open();
        }
    }
    
    async open() {
        this.isOpen = true;
        this.dropdown.classList.add('open');
        
        // Load customers if not loaded yet
        if (!this.loaded && !this.isLoading) {
            await this.loadCustomers();
        }
        
        this.render();
    }
    
    close() {
        this.isOpen = false;
        this.dropdown.classList.remove('open');
    }
    
    async loadCustomers() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.renderLoading();
        
        try {
            console.log('🔄 Loading customers from webhook...');
            
            // Use the HTTP client to fetch data
            const client = createHttpClient('https://hook.eu1.make.com');
            const response = await client.get('/s6a1sewxzui7n7ygf1lb3hltfpfxhham');
            
            console.log('📥 Raw response:', response);
            
            // Parse JSONL data (response might be multiple JSON objects concatenated)
            let jsonObjects = [];
            
            // First try splitting by newlines (standard JSONL)
            const lines = response.trim().split('\n').filter(line => line.trim());
            
            if (lines.length === 1 && lines[0].includes('}{')) {
                // Data is concatenated JSON objects, need to split them
                console.log('🔧 Detected concatenated JSON, splitting...');
                const concatenated = lines[0];
                const jsonStrings = [];
                let depth = 0;
                let start = 0;
                
                for (let i = 0; i < concatenated.length; i++) {
                    if (concatenated[i] === '{') depth++;
                    if (concatenated[i] === '}') {
                        depth--;
                        if (depth === 0) {
                            jsonStrings.push(concatenated.substring(start, i + 1));
                            start = i + 1;
                        }
                    }
                }
                
                jsonObjects = jsonStrings;
            } else {
                // Standard JSONL format
                jsonObjects = lines;
            }
            
            console.log('📊 Found JSON objects:', jsonObjects.length);
            
            this.customers = jsonObjects.map((jsonStr, index) => {
                try {
                    const data = JSON.parse(jsonStr.trim());
                    const customer = {
                        id: data.id,
                        name: data.company_name,
                        website: data.website,
                        website_indexed: data.website_indexed,
                        index_status: data.website_index_status
                    };
                    console.log(`✅ Parsed customer ${index + 1}:`, customer);
                    return customer;
                } catch (e) {
                    console.warn('Failed to parse JSON:', jsonStr, e);
                    return null;
                }
            }).filter(customer => customer !== null);
            
            this.loaded = true;
            console.log('✅ Customers loaded:', this.customers);
            
        } catch (error) {
            console.error('❌ Failed to load customers:', error);
            this.renderError(error.message);
            return;
        } finally {
            this.isLoading = false;
        }
        
        this.render();
    }
    
    selectCustomer(customer) {
        const previousCustomer = this.selectedCustomer;
        
        // Clear any existing status refresh timer
        if (this.statusRefreshTimer) {
            clearTimeout(this.statusRefreshTimer);
            this.statusRefreshTimer = null;
        }
        
        this.selectedCustomer = customer;
        this.selectedSpan.textContent = customer.name;
        this.hintSpan.textContent = customer.website;
        
        // Update header
        this.updateHeader();
        
        // Update step content
        this.updateStepContent();
        
        // Save to cookie
        this.saveToCookie();
        
        this.close();
        
        console.log('✅ Customer selected:', customer);
        this.showNotification(`Selected: ${customer.name}`);
        
        // If customer changed (not initial selection), refresh page to update all step content
        if (previousCustomer && previousCustomer.id !== customer.id) {
            console.log('🔄 Customer changed, refreshing page to update step content...');
            setTimeout(() => {
                window.location.reload();
            }, 1000); // Small delay to show notification
        }
    }
    
    render() {
        console.log('🎨 Rendering dropdown, isOpen:', this.isOpen, 'isLoading:', this.isLoading, 'customers:', this.customers.length);
        
        if (!this.isOpen) return;
        
        if (this.isLoading) {
            this.renderLoading();
            return;
        }
        
        let html = '';
        
        // Add customer items
        this.customers.forEach(customer => {
            html += `
                <button class="menu-item customer" data-customer-id="${customer.id}">
                    <div class="icon">
                        <i class="fas fa-building"></i>
                    </div>
                    <div class="content">
                        <div class="title">${this.escapeHtml(customer.name)}</div>
                        <div class="subtitle">${this.escapeHtml(customer.website)}</div>
                    </div>
                </button>
            `;
        });
        
        // Add "Add new customer" option
        html += `
            <button class="menu-item add-new" id="addNewCustomer">
                <div class="icon">
                    <i class="fas fa-plus"></i>
                </div>
                <div class="content">
                    <div class="title">Add new customer</div>
                    <div class="subtitle">Create a new customer profile</div>
                </div>
            </button>
        `;
        
        this.menu.innerHTML = html;
        
        // Bind click events
        this.menu.querySelectorAll('.menu-item.customer').forEach(item => {
            item.addEventListener('click', (e) => {
                const customerId = e.currentTarget.getAttribute('data-customer-id');
                const customer = this.customers.find(c => c.id == customerId);
                if (customer) {
                    this.selectCustomer(customer);
                }
            });
        });
        
        const addNewBtn = this.menu.querySelector('#addNewCustomer');
        if (addNewBtn) {
            addNewBtn.addEventListener('click', () => {
                this.handleAddNew();
            });
        }
    }
    
    renderLoading() {
        this.menu.innerHTML = `
            <div class="menu-loading">
                <div class="spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
                <div class="title">Loading customers...</div>
                <div class="subtitle">Please wait</div>
            </div>
        `;
    }
    
    renderError(message) {
        this.menu.innerHTML = `
            <div class="menu-error">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="title">Failed to load customers</div>
                <div class="subtitle">${this.escapeHtml(message)}</div>
                <button class="retry-btn" onclick="customerDropdown.retry()">
                    <i class="fas fa-redo"></i> Try Again
                </button>
            </div>
        `;
    }
    
    retry() {
        this.loaded = false;
        this.isLoading = false;
        this.loadCustomers();
    }
    
    handleAddNew() {
        this.close();
        this.showNotification('Add new customer functionality coming soon!');
        console.log('🔄 Add new customer clicked');
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    showNotification(message, type = 'success') {
        // Create simple notification
        const notification = document.createElement('div');
        
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            info: '#3b82f6'
        };
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type] || colors.success};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-size: 14px;
            font-weight: 500;
            animation: slideInRight 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Add slide-in animation style if not exists
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 4000);
    }
    
    // Cookie management
    saveToCookie() {
        if (this.selectedCustomer) {
            const customerData = JSON.stringify(this.selectedCustomer);
            document.cookie = `selectedCustomer=${encodeURIComponent(customerData)}; expires=${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString()}; path=/`;
            console.log('💾 Customer saved to cookie:', this.selectedCustomer);
        }
    }
    
    loadFromCookie() {
        const cookies = document.cookie.split(';');
        const customerCookie = cookies.find(cookie => cookie.trim().startsWith('selectedCustomer='));
        
        if (customerCookie) {
            try {
                const customerData = decodeURIComponent(customerCookie.split('=')[1]);
                this.selectedCustomer = JSON.parse(customerData);
                console.log('🍪 Customer loaded from cookie:', this.selectedCustomer);
                
                // Update dropdown trigger
                this.selectedSpan.textContent = this.selectedCustomer.name;
                this.hintSpan.textContent = this.selectedCustomer.website;
                
                // Update header
                this.updateHeader();
                
                // Update step content
                this.updateStepContent();
                
            } catch (e) {
                console.warn('Failed to parse customer cookie:', e);
                this.clearCookie();
            }
        }
    }
    
    clearCookie() {
        document.cookie = 'selectedCustomer=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
        console.log('🗑️ Customer cookie cleared');
    }
    
    // Header management
    updateHeader() {
        if (this.selectedCustomer && this.headerCustomer) {
            this.headerCustomerName.textContent = this.selectedCustomer.name;
            this.headerCustomerWebsite.textContent = this.selectedCustomer.website;
            this.headerCustomer.style.display = 'flex';
            console.log('📋 Header updated with customer:', this.selectedCustomer.name);
        } else if (this.headerCustomer) {
            this.headerCustomer.style.display = 'none';
        }
    }
    
    scrollToDropdown() {
        const customerSection = document.querySelector('.customer-selection');
        if (customerSection) {
            customerSection.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }
    
    // Update step content based on selected customer
    updateStepContent() {
        if (this.selectedCustomer) {
            this.updateStep1Analysis();
            this.updateIndexButton();
            console.log('📊 Step content updated for customer:', this.selectedCustomer.name);
        } else {
            this.updateIndexButton();
        }
    }
    
    updateStep1Analysis() {
        const customerWebsiteEl = document.getElementById('customerWebsite');
        const indexingStatusEl = document.getElementById('indexingStatus');
        
        if (customerWebsiteEl && indexingStatusEl && this.selectedCustomer) {
            // Update website display
            customerWebsiteEl.innerHTML = `<a href="${this.selectedCustomer.website}" target="_blank" rel="noopener">${this.selectedCustomer.website}</a>`;
            
            // Clear any existing status refresh timer
            if (this.statusRefreshTimer) {
                clearTimeout(this.statusRefreshTimer);
                this.statusRefreshTimer = null;
            }
            
            // Update indexing status based on index_status field
            const status = this.selectedCustomer.index_status;
            let statusHTML = '';
            
            switch (status) {
                case 'not_indexed':
                    statusHTML = '<span class="status-badge not-indexed">Not Indexed</span>';
                    this.highlightIndexButton(true);
                    break;
                    
                case 'indexing':
                    statusHTML = `
                        <div class="indexing-status">
                            <span class="status-badge indexing">
                                <i class="fas fa-spinner fa-spin"></i>
                                Indexing...
                            </span>
                        </div>
                    `;
                    this.highlightIndexButton(false);
                    // Start auto-refresh for indexing status
                    this.startStatusRefresh();
                    break;
                    
                               case 'index_ready':
                   const indexed = this.selectedCustomer.website_indexed;
                   if (indexed && indexed !== null && indexed !== undefined && indexed !== '') {
                       const formattedDate = this.formatIndexedDate(indexed);
                       statusHTML = `
                           <div class="indexed-status">
                               <span class="status-badge indexed">Index Ready</span>
                               <span class="indexed-date">${formattedDate}</span>
                           </div>
                       `;
                   } else {
                       statusHTML = '<span class="status-badge indexed">Index Ready</span>';
                   }
                   this.highlightIndexButton(false);
                   
                   // Load website information when index is ready
                   console.log('🌐 Index is ready, loading website info for:', this.selectedCustomer.website);
                   this.loadWebsiteInfo();
                   break;
                    
                default:
                    statusHTML = '<span class="status-badge pending">Status Unknown</span>';
                    this.highlightIndexButton(false);
                    break;
            }
            
            indexingStatusEl.innerHTML = statusHTML;
            
            console.log(`📋 Step 1 updated: ${this.selectedCustomer.name} - Status: ${status} - Website: ${this.selectedCustomer.website}`);
        }
    }
    
    formatIndexedDate(timestamp) {
        try {
            // Handle different timestamp formats
            let date;
            
            if (typeof timestamp === 'number') {
                // Unix timestamp (seconds or milliseconds)
                date = timestamp > 1000000000000 ? new Date(timestamp) : new Date(timestamp * 1000);
            } else if (typeof timestamp === 'string') {
                // ISO string or other date format
                date = new Date(timestamp);
            } else {
                // Already a Date object
                date = timestamp;
            }
            
            // Check if date is valid
            if (isNaN(date.getTime())) {
                return `Indexed (${timestamp})`;
            }
            
            // Format as user-friendly date
            const now = new Date();
            const diffTime = now - date;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) {
                return 'Indexed today';
            } else if (diffDays === 1) {
                return 'Indexed yesterday';
            } else if (diffDays < 7) {
                return `Indexed ${diffDays} days ago`;
            } else if (diffDays < 30) {
                const weeks = Math.floor(diffDays / 7);
                return `Indexed ${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
            } else {
                // For older dates, show the actual date
                return `Indexed ${date.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                })}`;
            }
        } catch (error) {
            console.warn('Error formatting indexed date:', error);
            return `Indexed (${timestamp})`;
        }
    }
    
    startStatusRefresh() {
        console.log('🔄 Starting status refresh timer (10 seconds)');
        this.statusRefreshTimer = setTimeout(() => {
            this.refreshCustomerStatus();
        }, 10000); // 10 seconds
    }
    
    async refreshCustomerStatus() {
        if (!this.selectedCustomer) return;
        
        console.log('🔄 Refreshing customer status...');
        
        try {
            // Reload customers to get updated status
            const previousLoaded = this.loaded;
            this.loaded = false; // Force reload
            await this.loadCustomers();
            
            // Find the updated customer data
            const updatedCustomer = this.customers.find(c => c.id === this.selectedCustomer.id);
            if (updatedCustomer) {
                // Update selected customer with new data
                this.selectedCustomer = updatedCustomer;
                
                // Update cookie with new data
                this.saveToCookie();
                
                // Update step content
                this.updateStep1Analysis();
                
                console.log('✅ Customer status refreshed:', updatedCustomer.index_status);
            }
            
        } catch (error) {
            console.error('❌ Error refreshing customer status:', error);
        }
    }
    
    highlightIndexButton(highlight) {
        if (this.indexWebsiteBtn) {
            if (highlight) {
                this.indexWebsiteBtn.classList.add('highlighted');
            } else {
                this.indexWebsiteBtn.classList.remove('highlighted');
            }
        }
    }
    
    updateIndexButton() {
        if (this.indexWebsiteBtn) {
            const actionNote = document.querySelector('.action-note');
            
            if (this.selectedCustomer) {
                this.indexWebsiteBtn.disabled = false;
                this.indexWebsiteBtn.innerHTML = '<i class="fas fa-search"></i> Index Website';
                if (actionNote) {
                    actionNote.textContent = `Index ${this.selectedCustomer.name}'s website for AI analysis`;
                }
            } else {
                this.indexWebsiteBtn.disabled = true;
                this.indexWebsiteBtn.innerHTML = '<i class="fas fa-search"></i> Index Website';
                if (actionNote) {
                    actionNote.textContent = 'Select a customer to enable indexing';
                }
            }
            
            // Reset button state
            this.indexWebsiteBtn.classList.remove('loading', 'success', 'error');
        }
    }
    
    async handleIndexWebsite() {
        if (!this.selectedCustomer || this.indexWebsiteBtn.disabled) {
            return;
        }
        
        const button = this.indexWebsiteBtn;
        const originalHTML = button.innerHTML;
        
        try {
            // Set loading state
            button.classList.add('loading');
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner"></i> Indexing...';
            
            console.log('🔄 Starting website indexing for:', this.selectedCustomer.name);
            
            // Create HTTP client for the indexing webhook
            const indexingClient = createHttpClient('https://hook.eu1.make.com');
            
            // Prepare payload with customer data
            const payload = {
                customer_id: this.selectedCustomer.id,
                customer_name: this.selectedCustomer.name,
                website: this.selectedCustomer.website,
                action: 'index_website'
            };
            
            console.log('📡 Sending indexing request:', payload);
            
            // Send webhook request
            const response = await indexingClient.post('/nstx2a6juc6fjmk71alu9islxt3yd524', payload);
            
            // Check if request was successful (any 2xx status)
            console.log('✅ Indexing webhook sent successfully, response:', response);
            
            // Set success state
            button.classList.remove('loading');
            button.classList.add('success');
            button.innerHTML = '<i class="fas fa-check"></i> Indexing Started';
            
            this.showNotification(`Website indexing started for ${this.selectedCustomer.name}`, 'success');
            
            // Refresh customer status to get updated indexing status
            setTimeout(async () => {
                console.log('🔄 Refreshing status after successful indexing request...');
                await this.refreshCustomerStatus();
                
                // Reset button after status refresh
                setTimeout(() => {
                    button.classList.remove('success');
                    button.disabled = false;
                    button.innerHTML = originalHTML;
                }, 1000);
            }, 2000); // Wait 2 seconds before refreshing status
            
        } catch (error) {
            console.error('❌ Error indexing website:', error);
            
            // Check if it's a 410 status (might be expected response)
            if (error.status === 410) {
                console.log('📋 Received 410 status - webhook endpoint processed request');
                
                // Treat 410 as success since webhook was processed
                button.classList.remove('loading');
                button.classList.add('success');
                button.innerHTML = '<i class="fas fa-check"></i> Request Processed';
                
                this.showNotification(`Indexing request sent for ${this.selectedCustomer.name}`, 'success');
                
                // Refresh customer status to get updated indexing status
                setTimeout(async () => {
                    console.log('🔄 Refreshing status after 410 response (indexing request processed)...');
                    await this.refreshCustomerStatus();
                    
                    // Reset button after status refresh
                    setTimeout(() => {
                        button.classList.remove('success');
                        button.disabled = false;
                        button.innerHTML = originalHTML;
                    }, 1000);
                }, 2000); // Wait 2 seconds before refreshing status
                
            } else {
                // Set error state for other errors
                button.classList.remove('loading');
                button.classList.add('error');
                button.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Failed';
                
                this.showNotification(`Failed to start indexing: ${error.message}`, 'error');
                
                // Reset button after 3 seconds
                setTimeout(() => {
                    button.classList.remove('error');
                    button.disabled = false;
                    button.innerHTML = originalHTML;
                }, 3000);
            }
        }
    }

    async loadWebsiteInfo() {
        if (!this.selectedCustomer || !this.selectedCustomer.website) {
            console.log('No selected customer or website for loading info');
            return;
        }

        const websiteInfoContainer = document.getElementById('websiteInfoContainer');
        if (!websiteInfoContainer) {
            console.log('Website info container not found');
            return;
        }

        try {
            // Show loading state
            websiteInfoContainer.innerHTML = `
                <div class="website-info-loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    Loading website information...
                </div>
            `;
            websiteInfoContainer.style.display = 'block';

            // Create HTTP client for website info
            const websiteInfoClient = createHttpClient('https://hook.eu1.make.com', {
                timeout: 30000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const websiteParam = encodeURIComponent(this.selectedCustomer.website);
            const endpoint = `/vtpg4alr9kauiajozfj3oq9mj9wfiror?website=${websiteParam}`;

            console.log('📡 Fetching website info for:', this.selectedCustomer.website);
            console.log('📡 Full URL:', `https://hook.eu1.make.com${endpoint}`);

            // Make the API call with website as query parameter
            const response = await websiteInfoClient.get(endpoint);
            
            console.log('✅ Website info received:', response);

            // Display the website information
            this.displayWebsiteInfo(response);

        } catch (error) {
            console.error('❌ Error loading website info:', error);
            
            // Check if it's a 410 status (might be expected response like the indexing webhook)
            if (error.status === 410) {
                console.log('📋 Website info webhook returned 410 - treating as accepted');
                websiteInfoContainer.innerHTML = `
                    <div class="website-info-content">
                        <h6><i class="fas fa-info-circle"></i> Website Information</h6>
                        <p>Website information request was accepted and is being processed.</p>
                    </div>
                `;
            } else {
                websiteInfoContainer.innerHTML = `
                    <div class="website-info-error">
                        <i class="fas fa-exclamation-triangle"></i>
                        Failed to load website information: ${error.message || 'Unknown error'}
                    </div>
                `;
            }
        }
    }

    displayWebsiteInfo(data) {
        const websiteInfoContainer = document.getElementById('websiteInfoContainer');
        if (!websiteInfoContainer || !data) {
            return;
        }

        let content = '';

        // Check if data is an array of pages or has a specific structure
        if (Array.isArray(data)) {
            // Data is an array of pages
            content = this.renderIndexedPages(data);
        } else if (data.pages && Array.isArray(data.pages)) {
            // Data has pages property
            content = this.renderIndexedPages(data.pages);
        } else if (typeof data === 'object') {
            // Data is an object, try to find page-like properties
            const pages = Object.values(data).filter(item => 
                typeof item === 'object' && (item.url || item.title || item.path)
            );
            if (pages.length > 0) {
                content = this.renderIndexedPages(pages);
            } else {
                content = this.renderGenericInfo(data);
            }
        } else {
            content = `
                <div class="website-info-content">
                    <h6>Website Information</h6>
                    <pre>${JSON.stringify(data, null, 2)}</pre>
                </div>
            `;
        }

        websiteInfoContainer.innerHTML = content;
    }

    renderIndexedPages(pages) {
        if (!pages || pages.length === 0) {
            return `
                <div class="website-info-content">
                    <h6><i class="fas fa-sitemap"></i> Indexed Pages</h6>
                    <p class="no-pages">No pages found for this website.</p>
                </div>
            `;
        }

        const pagesList = pages.map(page => {
            const url = page.url || page.link || page.path || '#';
            const title = page.title || page.name || url;
            const description = page.description || page.content || '';
            
            return `
                <div class="indexed-page">
                    <div class="page-header">
                        <h7 class="page-title">
                            <a href="${url}" target="_blank" rel="noopener">${title}</a>
                        </h7>
                        <span class="page-url">${url}</span>
                    </div>
                    ${description ? `<p class="page-description">${description.substring(0, 150)}${description.length > 150 ? '...' : ''}</p>` : ''}
                </div>
            `;
        }).join('');

        return `
            <div class="website-info-content">
                <h6><i class="fas fa-sitemap"></i> Indexed Pages (${pages.length})</h6>
                <div class="indexed-pages-list">
                    ${pagesList}
                </div>
            </div>
        `;
    }

    renderGenericInfo(data) {
        const entries = Object.entries(data).map(([key, value]) => {
            const displayValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : value;
            return `
                <div class="info-item">
                    <span class="info-label">${key}:</span>
                    <span class="info-value">${displayValue}</span>
                </div>
            `;
        }).join('');

        return `
            <div class="website-info-content">
                <h6><i class="fas fa-info-circle"></i> Website Information</h6>
                <div class="info-list">
                    ${entries}
                </div>
            </div>
        `;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.customerDropdown = new CustomerDropdown();
    console.log('✅ Customer dropdown initialized');
});
