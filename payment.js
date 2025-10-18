// ===== BETALINGSFUNCTIONALITEIT LAFEAU =====

class PaymentSystem {
    constructor() {
        this.shippingCost = 4.95;
        this.freeShippingThreshold = 100;
        this.paymentMethods = ['ideal', 'creditcard', 'paypal'];
    }
    
    init() {
        this.setupPaymentListeners();
        this.loadCheckoutData();
    }
    
    // ===== CHECKOUT PROCESS =====
    proceedToCheckout() {
        const cart = JSON.parse(localStorage.getItem('lafeauCart')) || [];
        
        if (cart.length === 0) {
            this.showNotification('Je winkelwagen is leeg', 'error');
            return;
        }
        
        this.showCheckoutModal();
    }
    
    showCheckoutModal() {
        const cart = JSON.parse(localStorage.getItem('lafeauCart')) || [];
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shipping = subtotal >= this.freeShippingThreshold ? 0 : this.shippingCost;
        const total = subtotal + shipping;
        
        const modal = document.createElement('div');
        modal.className = 'checkout-modal';
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
            z-index: 3000;
            animation: fadeIn 0.3s ease;
        `;
        
        modal.innerHTML = `
            <div class="checkout-content" style="
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
                
                <h2 style="font-family: 'Playfair Display', serif; margin-bottom: 1.5rem; text-align: center;">
                    Afrekenen
                </h2>
                
                <!-- Order Samenvatting -->
                <div class="order-summary" style="margin-bottom: 2rem;">
                    <h3 style="margin-bottom: 1rem;">Jouw bestelling</h3>
                    ${cart.map(item => `
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span>${item.name} (${item.quantity}x)</span>
                            <span>€${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    `).join('')}
                    <hr style="margin: 1rem 0;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span>Subtotaal:</span>
                        <span>€${subtotal.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span>Verzending:</span>
                        <span>${shipping === 0 ? 'Gratis' : `€${shipping.toFixed(2)}`}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.1rem;">
                        <span>Totaal:</span>
                        <span>€${total.toFixed(2)}</span>
                    </div>
                </div>
                
                <!-- Verzendinformatie -->
                <div class="shipping-info" style="margin-bottom: 2rem;">
                    <h3 style="margin-bottom: 1rem;">Verzendinformatie</h3>
                    <input type="text" placeholder="Volledige naam" style="width: 100%; padding: 0.75rem; margin-bottom: 0.5rem; border: 1px solid #ddd; border-radius: 5px;">
                    <input type="email" placeholder="E-mailadres" style="width: 100%; padding: 0.75rem; margin-bottom: 0.5rem; border: 1px solid #ddd; border-radius: 5px;">
                    <input type="text" placeholder="Adres" style="width: 100%; padding: 0.75rem; margin-bottom: 0.5rem; border: 1px solid #ddd; border-radius: 5px;">
                    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 0.5rem;">
                        <input type="text" placeholder="Stad" style="padding: 0.75rem; border: 1px solid #ddd; border-radius: 5px;">
                        <input type="text" placeholder="Postcode" style="padding: 0.75rem; border: 1px solid #ddd; border-radius: 5px;">
                    </div>
                </div>
                
                <!-- Betaalmethode -->
                <div class="payment-method" style="margin-bottom: 2rem;">
                    <h3 style="margin-bottom: 1rem;">Betaalmethode</h3>
                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                        <label style="display: flex; align-items: center; gap: 0.5rem;">
                            <input type="radio" name="payment" value="ideal" checked>
                            <span>iDEAL</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem;">
                            <input type="radio" name="payment" value="creditcard">
                            <span>Creditcard</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem;">
                            <input type="radio" name="payment" value="paypal">
                            <span>PayPal</span>
                        </label>
                    </div>
                </div>
                
                <!-- Betalingsknop -->
                <button onclick="paymentSystem.processPayment()" style="
                    width: 100%;
                    padding: 1rem;
                    background: linear-gradient(135deg, #D4AF37, #B8860B);
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-size: 1.1rem;
                    cursor: pointer;
                    font-weight: bold;
                ">
                    Bevestig Bestelling - €${total.toFixed(2)}
                </button>
                
                <p style="text-align: center; margin-top: 1rem; font-size: 0.8rem; color: #666;">
                    🔒 Veilig betalen via versleutelde verbinding
                </p>
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
    
    // ===== PAYMENT PROCESSING =====
    async processPayment() {
        const cart = JSON.parse(localStorage.getItem('lafeauCart')) || [];
        const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
        
        // Simuleer betalingsverwerking
        this.showLoadingState();
        
        try {
            // Simuleer API call
            await this.simulatePaymentAPI(cart, paymentMethod);
            
            // Succes
            this.showSuccessModal();
            this.clearCart();
            
        } catch (error) {
            this.showErrorModal(error.message);
        }
    }
    
    simulatePaymentAPI(cart, paymentMethod) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simuleer 10% kans op falen voor demo
                if (Math.random() < 0.1) {
                    reject(new Error('Betalingsverwerking mislukt. Probeer opnieuw.'));
                } else {
                    resolve({
                        success: true,
                        orderId: 'ORD-' + Date.now(),
                        amount: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
                    });
                }
            }, 2000);
        });
    }
    
    // ===== UI STATES =====
    showLoadingState() {
        const button = document.querySelector('.checkout-content button');
        const originalText = button.innerHTML;
        
        button.innerHTML = '⏳ Bezig met verwerken...';
        button.disabled = true;
        
        // Reset na 3 seconden (fallback)
        setTimeout(() => {
            button.innerHTML = originalText;
            button.disabled = false;
        }, 3000);
    }
    
    showSuccessModal() {
        const modal = document.querySelector('.checkout-modal');
        if (modal) modal.remove();
        
        const successModal = document.createElement('div');
        successModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 3000;
        `;
        
        successModal.innerHTML = `
            <div style="
                background: white;
                border-radius: 20px;
                padding: 3rem 2rem;
                max-width: 400px;
                width: 90%;
                text-align: center;
            ">
                <div style="font-size: 4rem; margin-bottom: 1rem;">🎉</div>
                <h2 style="font-family: 'Playfair Display', serif; margin-bottom: 1rem;">
                    Bestelling Voltooid!
                </h2>
                <p style="margin-bottom: 2rem; line-height: 1.6;">
                    Bedankt voor je aankoop bij Lafeau. Je bestelling wordt verwerkt en je ontvangt binnenkort een bevestigingsmail.
                </p>
                <button onclick="this.parentElement.parentElement.remove(); location.reload();" style="
                    padding: 1rem 2rem;
                    background: linear-gradient(135deg, #D4AF37, #B8860B);
                    color: white;
                    border: none;
                    border-radius: 10px;
                    cursor: pointer;
                    font-size: 1rem;
                ">
                    Doorgaan met Winkelen
                </button>
            </div>
        `;
        
        document.body.appendChild(successModal);
    }
    
    showErrorModal(message) {
        const modal = document.createElement('div');
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
            z-index: 3000;
        `;
        
        modal.innerHTML = `
            <div style="
                background: white;
                border-radius: 20px;
                padding: 2rem;
                max-width: 400px;
                width: 90%;
                text-align: center;
            ">
                <div style="font-size: 3rem; margin-bottom: 1rem;">❌</div>
                <h2 style="font-family: 'Playfair Display', serif; margin-bottom: 1rem; color: #ef4444;">
                    Betaling Mislukt
                </h2>
                <p style="margin-bottom: 2rem; line-height: 1.6;">
                    ${message}
                </p>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    padding: 1rem 2rem;
                    background: #ef4444;
                    color: white;
                    border: none;
                    border-radius: 10px;
                    cursor: pointer;
                    font-size: 1rem;
                ">
                    Opnieuw Proberen
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    showNotification(message, type = 'info') {
        // Hergebruik de notificatiefunctie van main.js als deze beschikbaar is
        if (typeof showNotification === 'function') {
            showNotification(message, type);
        } else {
            console.log(`${type}: ${message}`);
        }
    }
    
    // ===== CART MANAGEMENT =====
    clearCart() {
        localStorage.removeItem('lafeauCart');
        if (typeof updateCartUI === 'function') {
            updateCartUI();
        }
    }
    
    loadCheckoutData() {
        // Laad eventuele opgeslagen checkout gegevens
        const savedData = localStorage.getItem('checkoutData');
        return savedData ? JSON.parse(savedData) : null;
    }
    
    saveCheckoutData(data) {
        localStorage.setItem('checkoutData', JSON.stringify(data));
    }
    
    setupPaymentListeners() {
        // Event listeners voor betalingsgerelateerde elementen
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('checkout-btn')) {
                this.proceedToCheckout();
            }
        });
    }
}

// Initialiseer payment system
const paymentSystem = new PaymentSystem();
document.addEventListener('DOMContentLoaded', () => {
    paymentSystem.init();
});

// Globale functie voor HTML onclick
function proceedToCheckout() {
    paymentSystem.proceedToCheckout();
}