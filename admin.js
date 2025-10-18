// ===== UITGEBREIDE ADMIN FUNCTIONALITEITEN =====

// Globale variabelen
let currentEditingProduct = null;
let allProducts = [];
let allOrders = [];
let allCustomers = [];

// Initialisatie wanneer DOM geladen is
document.addEventListener('DOMContentLoaded', function() {
    // Controleer authenticatie
    if (!checkAuth()) {
        window.location.href = 'login.html';
        return;
    }
    
    // Toon gebruiker info
    displayUserInfo();
    
    // Initialiseer alle admin functionaliteiten
    initAdminNavigation();
    initProductManagement();
    initOrderManagement();
    initCustomerManagement();
    initInventoryManagement();
    initAnalytics();
    initSettings();
    
    // Laad initiële data
    loadDashboardData();
    loadAllProducts();
    loadAllOrders();
    loadAllCustomers();
});

// ===== ADMIN NAVIGATIE =====
function initAdminNavigation() {
    const navButtons = document.querySelectorAll('.admin-nav-btn');
    
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Verwijder active class van alle buttons
            navButtons.forEach(btn => btn.classList.remove('active'));
            // Voeg active class toe aan geklikte button
            this.classList.add('active');
            
            // Toon bijbehorende section
            const sectionId = this.dataset.section + '-section';
            document.querySelectorAll('.admin-section').forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById(sectionId).classList.add('active');
        });
    });
}

// ===== DASHBOARD FUNCTIONALITEIT =====
function loadDashboardData() {
    const products = JSON.parse(localStorage.getItem('webshopProducts')) || [];
    const orders = JSON.parse(localStorage.getItem('webshopOrders')) || [];
    const customers = JSON.parse(localStorage.getItem('webshopCustomers')) || [];
    
    // Update statistieken
    updateDashboardStats(products, orders, customers);
    updateRecentOrders(orders);
    updateStockAlerts(products);
    updatePopularProducts(products, orders);
}

function updateDashboardStats(products, orders, customers) {
    // Totale omzet
    const totalRevenue = orders
        .filter(order => order.status === 'delivered')
        .reduce((sum, order) => sum + order.total, 0);
    document.getElementById('total-revenue').textContent = `€${totalRevenue.toFixed(2)}`;
    
    // Totaal bestellingen
    document.getElementById('total-orders').textContent = orders.length;
    
    // Totaal producten
    document.getElementById('total-products').textContent = products.length;
    
    // Totaal klanten
    document.getElementById('total-customers').textContent = customers.length;
}

function updateRecentOrders(orders) {
    const recentOrdersContainer = document.getElementById('recent-orders');
    const recentOrders = orders.slice(-5).reverse();
    
    if (recentOrders.length === 0) {
        recentOrdersContainer.innerHTML = '<p>Geen recente bestellingen</p>';
        return;
    }
    
    recentOrdersContainer.innerHTML = recentOrders.map(order => `
        <div class="recent-order-item">
            <div class="order-info">
                <strong>#${order.id}</strong>
                <span class="order-status ${order.status}">${getOrderStatusLabel(order.status)}</span>
            </div>
            <div class="order-details">
                <span>€${order.total.toFixed(2)}</span>
                <small>${new Date(order.createdAt).toLocaleDateString()}</small>
            </div>
        </div>
    `).join('');
}

function updateStockAlerts(products) {
    const stockAlertsContainer = document.getElementById('stock-alerts');
    const lowStockProducts = products.filter(product => product.stock <= product.lowStockWarning);
    
    if (lowStockProducts.length === 0) {
        stockAlertsContainer.innerHTML = '<p>Geen voorraad waarschuwingen</p>';
        return;
    }
    
    stockAlertsContainer.innerHTML = lowStockProducts.map(product => `
        <div class="stock-alert-item">
            <span class="product-name">${product.name}</span>
            <span class="stock-count ${product.stock === 0 ? 'out-of-stock' : 'low-stock'}">
                ${product.stock} op voorraad
            </span>
        </div>
    `).join('');
}

function updatePopularProducts(products, orders) {
    const popularProductsContainer = document.getElementById('popular-products');
    
    // Simpele populariteit berekening (in een echte app zou dit complexer zijn)
    const productSales = {};
    orders.forEach(order => {
        order.items.forEach(item => {
            productSales[item.productId] = (productSales[item.productId] || 0) + item.quantity;
        });
    });
    
    const popularProducts = products
        .map(product => ({
            ...product,
            sales: productSales[product.id] || 0
        }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5);
    
    if (popularProducts.length === 0) {
        popularProductsContainer.innerHTML = '<p>Geen verkoop data beschikbaar</p>';
        return;
    }
    
    popularProductsContainer.innerHTML = popularProducts.map(product => `
        <div class="popular-product-item">
            <span class="product-name">${product.name}</span>
            <span class="sales-count">${product.sales} verkocht</span>
        </div>
    `).join('');
}

// ===== PRODUCT MANAGEMENT =====
function initProductManagement() {
    const productForm = document.getElementById('product-form');
    
    if (productForm) {
        productForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveOrUpdateProduct();
        });
    }
    
    // Auto-generate SKU
    document.getElementById('product-name')?.addEventListener('blur', function() {
        if (!document.getElementById('product-sku').value) {
            document.getElementById('product-sku').value = generateSKU();
        }
    });
}

function showProductForm() {
    document.getElementById('product-form').style.display = 'block';
    document.getElementById('product-submit-btn').textContent = '✅ Product Toevoegen';
    document.getElementById('reset-btn').style.display = 'none';
    currentEditingProduct = null;
}

function hideProductForm() {
    document.getElementById('product-form').style.display = 'none';
    resetForm();
}

function saveOrUpdateProduct() {
    const productId = document.getElementById('product-id').value;
    const productData = {
        id: productId ? parseInt(productId) : Date.now(),
        name: document.getElementById('product-name').value.trim(),
        sku: document.getElementById('product-sku').value.trim(),
        price: parseFloat(document.getElementById('product-price').value),
        salePrice: document.getElementById('product-sale-price').value ? 
                   parseFloat(document.getElementById('product-sale-price').value) : null,
        category: document.getElementById('product-category').value,
        material: document.getElementById('product-material').value,
        weight: document.getElementById('product-weight').value ? 
                parseFloat(document.getElementById('product-weight').value) : null,
        description: document.getElementById('product-description').value.trim(),
        features: document.getElementById('product-features').value.split('\n').filter(f => f.trim()),
        stock: parseInt(document.getElementById('product-stock').value) || 0,
        lowStockWarning: parseInt(document.getElementById('product-low-stock').value) || 5,
        image: document.getElementById('product-image').value.trim(),
        gallery: document.getElementById('product-gallery').value.split(',').map(url => url.trim()).filter(url => url),
        status: document.getElementById('product-status').value,
        featured: document.getElementById('product-featured').checked,
        createdAt: productId ? 
                  (allProducts.find(p => p.id === parseInt(productId))?.createdAt || new Date().toISOString()) : 
                  new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // Validatie
    if (!productData.name || !productData.sku || !productData.price || !productData.category) {
        alert('Vul alle verplichte velden in');
        return;
    }
    
    // Sla product op
    if (saveProduct(productData)) {
        const message = productId ? 'Product succesvol bijgewerkt!' : 'Product succesvol toegevoegd!';
        showNotification(message, 'success');
        
        hideProductForm();
        loadAllProducts();
        loadDashboardData(); // Update dashboard
    } else {
        showNotification('Er ging iets mis bij het opslaan', 'error');
    }
}

function saveProduct(product) {
    try {
        let products = JSON.parse(localStorage.getItem('webshopProducts')) || [];
        
        if (product.id) {
            // Update bestaand product
            const index = products.findIndex(p => p.id === product.id);
            if (index !== -1) {
                products[index] = product;
            } else {
                products.push(product);
            }
        } else {
            // Nieuw product
            product.id = Date.now();
            products.push(product);
        }
        
        localStorage.setItem('webshopProducts', JSON.stringify(products));
        return true;
    } catch (error) {
        console.error('Error saving product:', error);
        return false;
    }
}

function loadAllProducts() {
    allProducts = JSON.parse(localStorage.getItem('webshopProducts')) || [];
    displayProductsTable(allProducts);
    updateInventoryStats();
}

function displayProductsTable(products) {
    const tableBody = document.getElementById('products-table-body');
    
    if (products.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem;">Geen producten gevonden</td></tr>';
        return;
    }
    
    tableBody.innerHTML = products.map(product => `
        <tr>
            <td>
                ${product.image ? 
                    `<img src="${product.image}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;" onerror="this.style.display='none'">` : 
                    '<div style="width: 50px; height: 50px; background: #f5f5f5; display: flex; align-items: center; justify-content: center; border-radius: 4px;">💎</div>'
                }
            </td>
            <td>${product.name}</td>
            <td>${product.sku}</td>
            <td>${getCategoryLabel(product.category)}</td>
            <td>€${product.price.toFixed(2)}</td>
            <td>
                <span class="stock-badge ${product.stock === 0 ? 'out-of-stock' : product.stock <= product.lowStockWarning ? 'low-stock' : 'in-stock'}">
                    ${product.stock}
                </span>
            </td>
            <td>
                <span class="status-badge ${product.status}">${getProductStatusLabel(product.status)}</span>
            </td>
            <td>
                <button class="btn-small btn-primary" onclick="editProduct(${product.id})">✏️</button>
                <button class="btn-small btn-secondary" onclick="toggleProductStatus(${product.id})">
                    ${product.status === 'active' ? '⏸️' : '▶️'}
                </button>
                <button class="btn-small btn-warning" onclick="deleteProduct(${product.id})">❌</button>
            </td>
        </tr>
    `).join('');
}

function editProduct(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    // Vul formulier in
    document.getElementById('product-id').value = product.id;
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-sku').value = product.sku;
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-sale-price').value = product.salePrice || '';
    document.getElementById('product-category').value = product.category;
    document.getElementById('product-material').value = product.material || '';
    document.getElementById('product-weight').value = product.weight || '';
    document.getElementById('product-description').value = product.description || '';
    document.getElementById('product-features').value = product.features?.join('\n') || '';
    document.getElementById('product-stock').value = product.stock;
    document.getElementById('product-low-stock').value = product.lowStockWarning || 5;
    document.getElementById('product-image').value = product.image || '';
    document.getElementById('product-gallery').value = product.gallery?.join(', ') || '';
    document.getElementById('product-status').value = product.status;
    document.getElementById('product-featured').checked = product.featured || false;
    
    // Toon formulier
    document.getElementById('product-form').style.display = 'block';
    document.getElementById('product-submit-btn').textContent = '✅ Product Bijwerken';
    document.getElementById('reset-btn').style.display = 'inline-block';
    currentEditingProduct = product;
}

function toggleProductStatus(productId) {
    const products = JSON.parse(localStorage.getItem('webshopProducts')) || [];
    const productIndex = products.findIndex(p => p.id === productId);
    
    if (productIndex !== -1) {
        products[productIndex].status = products[productIndex].status === 'active' ? 'inactive' : 'active';
        products[productIndex].updatedAt = new Date().toISOString();
        
        localStorage.setItem('webshopProducts', JSON.stringify(products));
        loadAllProducts();
        showNotification('Product status bijgewerkt', 'success');
    }
}

function deleteProduct(productId) {
    if (confirm('Weet je zeker dat je dit product wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.')) {
        const products = JSON.parse(localStorage.getItem('webshopProducts')) || [];
        const filteredProducts = products.filter(p => p.id !== productId);
        localStorage.setItem('webshopProducts', JSON.stringify(filteredProducts));
        loadAllProducts();
        showNotification('Product verwijderd', 'success');
    }
}

function searchProducts() {
    const searchTerm = document.getElementById('product-search').value.toLowerCase();
    const categoryFilter = document.getElementById('category-filter').value;
    const statusFilter = document.getElementById('status-filter').value;
    
    let filteredProducts = allProducts;
    
    if (searchTerm) {
        filteredProducts = filteredProducts.filter(product => 
            product.name.toLowerCase().includes(searchTerm) ||
            product.sku.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm)
        );
    }
    
    if (categoryFilter) {
        filteredProducts = filteredProducts.filter(product => product.category === categoryFilter);
    }
    
    if (statusFilter) {
        filteredProducts = filteredProducts.filter(product => product.status === statusFilter);
    }
    
    displayProductsTable(filteredProducts);
}

// ===== ORDER MANAGEMENT =====
function initOrderManagement() {
    // Wordt later geïmplementeerd
}

function loadAllOrders() {
    allOrders = JSON.parse(localStorage.getItem('webshopOrders')) || [];
    updateOrderStats();
}

function updateOrderStats() {
    const pendingOrders = allOrders.filter(order => order.status === 'pending').length;
    const processingOrders = allOrders.filter(order => order.status === 'processing').length;
    const completedOrders = allOrders.filter(order => order.status === 'delivered').length;
    
    document.getElementById('pending-orders').textContent = `${pendingOrders} in afwachting`;
    document.getElementById('processing-orders').textContent = `${processingOrders} in verwerking`;
    document.getElementById('completed-orders').textContent = `${completedOrders} voltooid`;
}

// ===== CUSTOMER MANAGEMENT =====
function initCustomerManagement() {
    // Wordt later geïmplementeerd
}

function loadAllCustomers() {
    allCustomers = JSON.parse(localStorage.getItem('webshopCustomers')) || [];
}

// ===== INVENTORY MANAGEMENT =====
function initInventoryManagement() {
    // Wordt later geïmplementeerd
}

function updateInventoryStats() {
    const lowStockCount = allProducts.filter(p => p.stock > 0 && p.stock <= p.lowStockWarning).length;
    const outOfStockCount = allProducts.filter(p => p.stock === 0).length;
    const totalInventoryValue = allProducts.reduce((sum, product) => sum + (product.price * product.stock), 0);
    
    document.getElementById('low-stock-count').textContent = lowStockCount;
    document.getElementById('out-of-stock-count').textContent = outOfStockCount;
    document.getElementById('total-inventory-value').textContent = `€${totalInventoryValue.toFixed(2)}`;
}

// ===== ANALYTICS =====
function initAnalytics() {
    // Wordt later geïmplementeerd
}

// ===== SETTINGS =====
function initSettings() {
    // Laad opgeslagen instellingen
    loadSettings();
    
    // Sla instellingen op bij wijzigingen
    document.querySelectorAll('.settings-form').forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            saveSettings();
        });
    });
}

function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('webshopSettings')) || {};
    
    document.getElementById('shop-name').value = settings.shopName || 'Lafeau';
    document.getElementById('shop-email').value = settings.shopEmail || '';
    document.getElementById('shop-phone').value = settings.shopPhone || '';
    document.getElementById('shop-currency').value = settings.shopCurrency || 'EUR';
    document.getElementById('shipping-cost').value = settings.shippingCost || 4.95;
    document.getElementById('free-shipping').value = settings.freeShippingThreshold || 100;
    document.getElementById('payment-ideal').checked = settings.paymentMethods?.includes('ideal') ?? true;
    document.getElementById('payment-creditcard').checked = settings.paymentMethods?.includes('creditcard') ?? true;
    document.getElementById('payment-paypal').checked = settings.paymentMethods?.includes('paypal') ?? true;
}

function saveSettings() {
    const settings = {
        shopName: document.getElementById('shop-name').value,
        shopEmail: document.getElementById('shop-email').value,
        shopPhone: document.getElementById('shop-phone').value,
        shopCurrency: document.getElementById('shop-currency').value,
        shippingCost: parseFloat(document.getElementById('shipping-cost').value),
        freeShippingThreshold: parseFloat(document.getElementById('free-shipping').value),
        paymentMethods: [
            document.getElementById('payment-ideal').checked ? 'ideal' : null,
            document.getElementById('payment-creditcard').checked ? 'creditcard' : null,
            document.getElementById('payment-paypal').checked ? 'paypal' : null
        ].filter(method => method !== null)
    };
    
    localStorage.setItem('webshopSettings', JSON.stringify(settings));
    showNotification('Instellingen opgeslagen', 'success');
}

// ===== HELPER FUNCTIES =====
function getCategoryLabel(category) {
    const categories = {
        'ringen': 'Ringen',
        'kettingen': 'Kettingen', 
        'armbanden': 'Armbanden',
        'oorbellen': 'Oorbellen',
        'horloges': 'Horloges'
    };
    return categories[category] || category;
}

function getProductStatusLabel(status) {
    const statusLabels = {
        'active': 'Actief',
        'inactive': 'Inactief',
        'draft': 'Concept'
    };
    return statusLabels[status] || status;
}

function getOrderStatusLabel(status) {
    const statusLabels = {
        'pending': 'In Afwachting',
        'processing': 'In Verwerking',
        'shipped': 'Verzonden',
        'delivered': 'Afgeleverd',
        'cancelled': 'Geannuleerd'
    };
    return statusLabels[status] || status;
}

function generateSKU() {
    const prefix = 'LAF';
    const timestamp = Date.now().toString(36).toUpperCase().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
}

function resetForm() {
    document.getElementById('product-form').reset();
    document.getElementById('product-id').value = '';
    currentEditingProduct = null;
}

function showNotification(message, type = 'info') {
    // Eenvoudige notificatie implementatie
    alert(`${type.toUpperCase()}: ${message}`);
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Voeg CSS toe voor de nieuwe elementen
const adminStyles = `
    .stock-badge {
        padding: 0.25rem 0.5rem;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: 600;
    }
    
    .stock-badge.in-stock { background: #d4edda; color: #155724; }
    .stock-badge.low-stock { background: #fff3cd; color: #856404; }
    .stock-badge.out-of-stock { background: #f8d7da; color: #721c24; }
    
    .status-badge {
        padding: 0.25rem 0.5rem;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: 600;
    }
    
    .status-badge.active { background: #d4edda; color: #155724; }
    .status-badge.inactive { background: #f8d7da; color: #721c24; }
    .status-badge.draft { background: #fff3cd; color: #856404; }
    
    .btn-small {
        padding: 0.25rem 0.5rem;
        font-size: 0.8rem;
        margin: 0 0.125rem;
    }
    
    .btn-warning {
        background: #dc3545;
        color: white;
        border: none;
    }
    
    .btn-warning:hover {
        background: #c82333;
    }
    
    .recent-order-item, .stock-alert-item, .popular-product-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 0;
        border-bottom: 1px solid #f0f0f0;
    }
    
    .order-status {
        padding: 0.125rem 0.5rem;
        border-radius: 8px;
        font-size: 0.7rem;
        font-weight: 600;
    }
    
    .order-status.pending { background: #fff3cd; color: #856404; }
    .order-status.processing { background: #d1ecf1; color: #0c5460; }
    .order-status.shipped { background: #cce7ff; color: #004085; }
    .order-status.delivered { background: #d4edda; color: #155724; }
    .order-status.cancelled { background: #f8d7da; color: #721c24; }
`;

// Voeg styles toe aan document
const styleSheet = document.createElement('style');
styleSheet.textContent = adminStyles;
document.head.appendChild(styleSheet);