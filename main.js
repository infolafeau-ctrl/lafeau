// ===== HOOFDFUNCTIONALITEITEN LAFEAU WEBSHOP =====

// Globale variabelen
let cart = JSON.parse(localStorage.getItem('lafeauCart')) || [];
let products = [];
let currentFilter = 'all';
let currentSort = 'newest';

// Initialisatie wanneer DOM geladen is
document.addEventListener('DOMContentLoaded', function() {
    initWebsite();
});

function initWebsite() {
    loadProductsFromStorage();
    updateCartUI();
    setupEventListeners();
    setupScrollEffects();
}

// ===== PRODUCTEN BEHEER =====
function loadProductsFromStorage() {
    const storedProducts = JSON.parse(localStorage.getItem('webshopProducts')) || [];
    products = storedProducts;
    displayProducts();
}

function displayProducts() {
    const productsGrid = document.getElementById('products-grid');
    const emptyState = document.getElementById('empty-state');
    
    if (products.length === 0) {
        productsGrid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    productsGrid.style.display = 'grid';
    emptyState.style.display = 'none';
    
    // Filter en sorteer producten
    let filteredProducts = filterProducts(products);
    filteredProducts = sortProducts(filteredProducts);
    
    productsGrid.innerHTML = filteredProducts.map(product => `
        <div class="product-card" data-category="${product.category}">
            <div class="product-image">
                ${product.image ? 
                    `<img src="${product.image}" alt="${product.name}" onerror="this.style.display='none'">` : 
                    '💎'
                }
            </div>
            <div class="product-info">
                <div class="product-category">${getCategoryLabel(product.category)}</div>
                <h3 class="product-title">${product.name}</h3>
                <p class="product-description">${product.description || 'Exclusief luxe sieraad van uitzonderlijke kwaliteit'}</p>
                <div class="product-price">€${product.price.toFixed(2)}</div>
                <div class="product-stock">${product.stock > 0 ? `${product.stock} op voorraad` : 'Tijdelijk uitverkocht'}</div>
                <div class="product-actions">
                    <button class="btn-primary" onclick="addToCart(${product.id})" 
                            ${product.stock === 0 ? 'disabled' : ''}>
                        ${product.stock === 0 ? 'Uitverkocht' : '🛒 In Winkelwagen'}
                    </button>
                    <button class="btn-secondary" onclick="viewProductDetails(${product.id})">
                        👁️ Details
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function filterProducts(productsList) {
    if (currentFilter === 'all') return productsList;
    return productsList.filter(product => product.category === currentFilter);
}

function sortProducts(productsList) {
    switch (currentSort) {
        case 'price-low':
            return [...productsList].sort((a, b) => a.price - b.price);
        case 'price-high':
            return [...productsList].sort((a, b) => b.price - a.price);
        case 'name':
            return [...productsList].sort((a, b) => a.name.localeCompare(b.name));
        case 'newest':
        default:
            return [...productsList].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
}

function getCategoryLabel(category) {
    const categories = {
        'rings': 'Ringen',
        'necklaces': 'Kettingen',
        'earrings': 'Oorbellen',
        'bracelets': 'Armbanden',
        'watches': 'Horloges'
    };
    return categories[category] || category;
}

// ===== FILTER EN SORT FUNCTIES =====
function setupEventListeners() {
    // Filter knoppen
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.category;
            displayProducts();
        });
    });
    
    // Sorteer select
    document.getElementById('sort-select').addEventListener('change', function() {
        currentSort = this.value;
        displayProducts();
    });
}

// ===== WINKELWAGEN FUNCTIONALITEIT =====
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    if (product.stock === 0) {
        showNotification('Dit product is momenteel uitverkocht', 'error');
        return;
    }
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        if (existingItem.quantity >= product.stock) {
            showNotification(`Maximaal ${product.stock} stuks beschikbaar`, 'warning');
            return;
        }
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...product,
            quantity: 1,
            cartAdded: new Date().toISOString()
        });
    }
    
    saveCart();
    updateCartUI();
    showNotification(`${product.name} toegevoegd aan winkelwagen`, 'success');
    
    // Laat winkelwagen zien
    setTimeout(() => {
        toggleCart();
    }, 1000);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartUI();
    showNotification('Product verwijderd uit winkelwagen', 'info');
}

function updateCartUI() {
    const cartCount = document.getElementById('cart-count');
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const grandTotal = document.getElementById('grand-total');
    
    // Update cart count
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    // Update cart items
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <p>Je winkelwagen is leeg</p>
                <button class="btn-primary" onclick="scrollToCollection()">Verder Winkelen</button>
            </div>
        `;
    } else {
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-image">
                    ${item.image ? 
                        `<img src="${item.image}" alt="${item.name}" onerror="this.style.display='none'">` : 
                        '💎'
                    }
                </div>
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <p>€${item.price.toFixed(2)}</p>
                    <div class="cart-item-quantity">
                        <button onclick="updateQuantity(${item.id}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="updateQuantity(${item.id}, 1)">+</button>
                    </div>
                </div>
                <button class="remove-item" onclick="removeFromCart(${item.id})">❌</button>
            </div>
        `).join('');
    }
    
    // Update totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal >= 100 ? 0 : 4.95;
    const total = subtotal + shipping;
    
    cartTotal.textContent = `€${subtotal.toFixed(2)}`;
    document.getElementById('shipping-cost').textContent = shipping === 0 ? 'Gratis' : `€${shipping.toFixed(2)}`;
    grandTotal.textContent = `€${total.toFixed(2)}`;
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;
    
    const newQuantity = item.quantity + change;
    
    if (newQuantity < 1) {
        removeFromCart(productId);
        return;
    }
    
    const product = products.find(p => p.id === productId);
    if (product && newQuantity > product.stock) {
        showNotification(`Maximaal ${product.stock} stuks beschikbaar`, 'warning');
        return;
    }
    
    item.quantity = newQuantity;
    saveCart();
    updateCartUI();
}

function saveCart() {
    localStorage.setItem('lafeauCart', JSON.stringify(cart));
}

// ===== CART MODAL FUNCTIES =====
function toggleCart() {
    const cartModal = document.getElementById('cart-modal');
    cartModal.classList.toggle('active');
    
    if (cartModal.classList.contains('active')) {
        updateCartUI();
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = 'auto';
    }
}

function scrollToCollection() {
    document.getElementById('collection').scrollIntoView({ 
        behavior: 'smooth' 
    });
    toggleCart();
}

// ===== UI EFFECTEN EN ANIMATIES =====
function setupScrollEffects() {
    const header = document.querySelector('.premium-header');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

function showNotification(message, type = 'info') {
    // Verwijder bestaande notificaties
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    
    // Voeg styles toe
    notification.style.cssText = `
        position: fixed;
        top: 120px;
        right: 20px;
        background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : type === 'warning' ? '#F59E0B' : '#3B82F6'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove na 4 seconden
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 4000);
}

// ===== PRODUCT DETAILS =====
function viewProductDetails(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const modal = document.createElement('div');
    modal.className = 'product-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
        animation: fadeIn 0.3s ease;
    `;
    
    modal.innerHTML = `
        <div class="product-modal-content" style="
            background: white;
            border-radius: 20px;
            padding: 2rem;
            max-width: 500px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
        ">
            <button onclick="this.parentElement.parentElement.remove()" style="
                position: absolute;
                top: 1rem;
                right: 1rem;
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
            ">×</button>
            
            <div class="product-image" style="
                width: 100%;
                height: 200px;
                background: #f5f5f5;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 3rem;
                margin-bottom: 1rem;
            ">
                ${product.image ? 
                    `<img src="${product.image}" alt="${product.name}" style="max-width: 100%; max-height: 100%;">` : 
                    '💎'
                }
            </div>
            
            <h2 style="font-family: 'Playfair Display', serif; margin-bottom: 0.5rem;">${product.name}</h2>
            <div style="color: #D4AF37; font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem;">
                €${product.price.toFixed(2)}
            </div>
            
            <p style="margin-bottom: 1rem; line-height: 1.6;">${product.description || 'Exclusief luxe sieraad van uitzonderlijke kwaliteit.'}</p>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 1rem;">
                <div><strong>Categorie:</strong> ${getCategoryLabel(product.category)}</div>
                <div><strong>Voorraad:</strong> ${product.stock} stuks</div>
                <div><strong>Materiaal:</strong> ${product.material || 'Niet gespecificeerd'}</div>
            </div>
            
            <button onclick="addToCart(${product.id}); this.parentElement.parentElement.remove();" 
                    style="width: 100%; padding: 1rem; background: linear-gradient(135deg, #D4AF37, #B8860B); color: white; border: none; border-radius: 10px; font-size: 1.1rem; cursor: pointer;"
                    ${product.stock === 0 ? 'disabled' : ''}>
                ${product.stock === 0 ? 'Uitverkocht' : '🛒 In Winkelwagen'}
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Sluit modal bij klik op achtergrond
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// ===== ZOEKFUNCTIE =====
function toggleSearch() {
    const searchBar = document.createElement('div');
    searchBar.style.cssText = `
        position: fixed;
        top: 120px;
        left: 50%;
        transform: translateX(-50%);
        background: white;
        padding: 1rem;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        z-index: 1000;
        display: flex;
        gap: 0.5rem;
    `;
    
    searchBar.innerHTML = `
        <input type="text" id="search-input" placeholder="Zoek producten..." style="
            padding: 0.5rem 1rem;
            border: 1px solid #ddd;
            border-radius: 5px;
            width: 300px;
        ">
        <button onclick="performSearch()" style="
            padding: 0.5rem 1rem;
            background: #D4AF37;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        ">Zoek</button>
        <button onclick="this.parentElement.remove()" style="
            padding: 0.5rem;
            background: #ef4444;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        ">×</button>
    `;
    
    document.body.appendChild(searchBar);
    
    // Focus op input
    setTimeout(() => {
        document.getElementById('search-input').focus();
    }, 100);
}

function performSearch() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    if (!searchTerm) return;
    
    const filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm)
    );
    
    // Toon zoekresultaten
    const productsGrid = document.getElementById('products-grid');
    if (filteredProducts.length === 0) {
        productsGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <h3>Geen producten gevonden</h3>
                <p>Probeer een andere zoekterm</p>
            </div>
        `;
    } else {
        productsGrid.innerHTML = filteredProducts.map(product => `
            <div class="product-card">
                <!-- Product card HTML zoals in displayProducts -->
            </div>
        `).join('');
    }
    
    // Verwijder search bar
    document.querySelector('div[style*="position: fixed; top: 120px"]').remove();
}

// ===== ACCOUNT FUNCTIE =====
function toggleAccount() {
    showNotification('Account functionaliteit komt binnenkort beschikbaar', 'info');
}

// ===== ADMIN LINK =====
function goToAdmin() {
    window.location.href = 'login.html';
}

// Voeg CSS animaties toe
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    .cart-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        border-bottom: 1px solid #eee;
    }
    
    .cart-item-image {
        width: 60px;
        height: 60px;
        background: #f5f5f5;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
    }
    
    .cart-item-details {
        flex: 1;
    }
    
    .cart-item-details h4 {
        margin: 0 0 0.5rem 0;
        font-size: 1rem;
    }
    
    .cart-item-quantity {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-top: 0.5rem;
    }
    
    .cart-item-quantity button {
        width: 25px;
        height: 25px;
        border: 1px solid #ddd;
        background: white;
        border-radius: 4px;
        cursor: pointer;
    }
    
    .remove-item {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 4px;
    }
    
    .remove-item:hover {
        background: #fee2e2;
    }
`;
document.head.appendChild(style);