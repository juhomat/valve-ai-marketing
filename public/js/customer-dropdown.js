// Simple Customer Dropdown Implementation
// Clean, robust solution that works with the known webhook format

class CustomerDropdown {
    constructor() {
        this.customers = [];
        this.selectedCustomer = null;
        this.isOpen = false;
        this.isLoading = false;
        this.loaded = false;
        
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
                        website: data.website
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
        this.selectedCustomer = customer;
        this.selectedSpan.textContent = customer.name;
        this.hintSpan.textContent = customer.website;
        
        // Update header
        this.updateHeader();
        
        // Save to cookie
        this.saveToCookie();
        
        this.close();
        
        console.log('✅ Customer selected:', customer);
        this.showNotification(`Selected: ${customer.name}`);
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
    
    showNotification(message) {
        // Create simple notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-size: 14px;
            font-weight: 500;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
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
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.customerDropdown = new CustomerDropdown();
    console.log('✅ Customer dropdown initialized');
});
