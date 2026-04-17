// =============================================
// BOCADO v3 — Complete Application Logic
// =============================================

// ---- 1. SEED DATA: Products ----
const SEED_PRODUCTS = [
    { id: 1,  name: 'Empanada de Carne',         price: 1450, category: 'Empanadas',  img: 'https://images.unsplash.com/photo-1601924287811-e34de5d17476?w=600&h=400&fit=crop', desc: 'Carne cortada a cuchillo, jugosa y especiada.' },
    { id: 2,  name: 'Empanada de Pollo',          price: 1450, category: 'Empanadas',  img: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&h=400&fit=crop', desc: 'Pollo desmenuzado con cebolla de verdeo.' },
    { id: 3,  name: 'Empanada de Humita',         price: 1450, category: 'Empanadas',  img: 'https://images.unsplash.com/photo-1609525313344-a56b96f0efc8?w=600&h=400&fit=crop', desc: 'Choclo cremoso y queso, la favorita del NOA.' },
    { id: 4,  name: 'Empanada de Jamón y Queso',  price: 1450, category: 'Empanadas',  img: 'https://images.unsplash.com/photo-1619221882220-947b3d3c8861?w=600&h=400&fit=crop', desc: 'Jamón cocido con mozzarella derretida.' },
    { id: 5,  name: 'Empanada Árabe (Sfiha)',     price: 1600, category: 'Empanadas',  img: 'https://images.unsplash.com/photo-1562059390-a761a084768e?w=600&h=400&fit=crop', desc: 'Carne especiada con limón, receta libanesa.' },
    { id: 6,  name: 'Empanada de Verdura',        price: 1350, category: 'Empanadas',  img: 'https://images.unsplash.com/photo-1645696996945-3254a0d35920?w=600&h=400&fit=crop', desc: 'Espinaca, cebolla y huevo duro.' },
    { id: 7,  name: 'Pizza Muzzarella',           price: 7500, category: 'Pizzas',     img: 'https://images.unsplash.com/photo-1574071318508-1cdbad80ad38?w=600&h=400&fit=crop', desc: 'Doble muzzarella con aceitunas verdes.' },
    { id: 8,  name: 'Pizza Napolitana',           price: 8500, category: 'Pizzas',     img: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600&h=400&fit=crop', desc: 'Rodajas de tomate, ajo y albahaca fresca.' },
    { id: 9,  name: 'Pizza Fugazzeta',            price: 8000, category: 'Pizzas',     img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=400&fit=crop', desc: 'Cebolla caramelizada abundante con muzzarella.' },
    { id: 10, name: 'Pizza Calabresa',            price: 8500, category: 'Pizzas',     img: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=600&h=400&fit=crop', desc: 'Longaniza calabresa picante con morrones.' },
    { id: 11, name: 'Coca-Cola 1.5L',             price: 2500, category: 'Bebidas',    img: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=600&h=400&fit=crop', desc: 'La clásica, bien helada.' },
    { id: 12, name: 'Sprite 1.5L',                price: 2500, category: 'Bebidas',    img: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=600&h=400&fit=crop', desc: 'Lima-limón refrescante.' },
    { id: 13, name: 'Agua Mineral 500ml',         price: 1200, category: 'Bebidas',    img: 'https://images.unsplash.com/photo-1564419320461-6eb9039cfa3e?w=600&h=400&fit=crop', desc: 'Sin gas, ideal para acompañar.' },
    { id: 14, name: 'Cerveza Quilmes 1L',         price: 3500, category: 'Bebidas',    img: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=600&h=400&fit=crop', desc: 'Retornable, bien fría.' },
    { id: 15, name: 'Fainá',                      price: 3500, category: 'Pizzas',     img: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop', desc: 'Harina de garbanzo crocante, el clásico acompañante.' },
];

// ---- 2. SEED DATA: Promo Banners ----
const SEED_BANNERS = [
    { id: 1, title: '🔥 HOY: Docena de Empanadas', subtitle: 'Llevá 12 y pagá 10. ¡Solo por hoy!', color: '#1a1311' },
    { id: 2, title: '🍕 Pizza + Fainá', subtitle: 'El combo clásico argentino a precio especial.', color: '#2d1f18' },
    { id: 3, title: '🛵 Envío GRATIS', subtitle: 'En pedidos mayores a $15.000 dentro del centro.', color: '#14281a' },
];

// ---- 3. STATE ----
let products = JSON.parse(localStorage.getItem('bocado_products')) || SEED_PRODUCTS;
let banners  = JSON.parse(localStorage.getItem('bocado_banners'))  || SEED_BANNERS;
let cart = [];
let currentCat = 'Todo';
let searchQuery = '';
let currentSlide = 0;
// Map Variables
let map = null;
let marker = null;
let currentLat = -26.830419; // Default center (Tucuman)
let currentLng = -65.203794;

// Persist seed on first run
if (!localStorage.getItem('bocado_products')) localStorage.setItem('bocado_products', JSON.stringify(SEED_PRODUCTS));
if (!localStorage.getItem('bocado_banners'))  localStorage.setItem('bocado_banners',  JSON.stringify(SEED_BANNERS));

// ---- 4. INIT ----
async function init() {
    // await initSecurity(); // <-- KILL SWITCH DESACTIVADO POR AHORA
    renderBanners();
    renderCategories();
    renderProducts();
    setupEvents();
    startCarousel();
}

// ==== KILL SWITCH (SISTEMA DE SEGURIDAD SAAS) ====
async function initSecurity() {
    try {
        // Imagina que este JSON lo subes a tu propio GitHub o servidor:
        // Contenido del JSON: { "bocado_demo": true, "pizzeria_juan": false }
        const CONTROL_URL = 'https://tudominio.com/clientes.json'; 
        
        // Descomentar lo siguiente cuando tengas la URL real
        /*
        const res = await fetch(CONTROL_URL);
        const clientes = await res.json();
        
        // Cambia "bocado_demo" por el ID que le asignes a este cliente
        if (clientes["bocado_demo"] === false) {
            document.body.innerHTML = `
                <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100vh; background:#1a1311; color:white; font-family:sans-serif; text-align:center; padding:20px;">
                    <h1 style="color:#e74c3c;">🛑 Servicio Suspendido</h1>
                    <p style="margin-top:10px;">Comuníquese con la administración para reactivar su menú.</p>
                </div>`;
            throw new Error("Sistema bloqueado por falta de pago");
        }
        */
    } catch (e) {
        console.warn("Error en validación de seguridad (ignorar en local)", e);
    }
}
// ===================================================

// ---- 5. HELPERS ----
function getDirectImageUrl(url) {
    if (!url) return '';
    // Intenta convertir enlaces de Google Drive a links directos de imagen
    if (url.includes('drive.google.com/file/d/')) {
        const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (match) return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    } else if (url.includes('drive.google.com/open?id=')) {
        const match = url.match(/id=([a-zA-Z0-9_-]+)/);
        if (match) return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
    return url;
}

// ---- 6. CAROUSEL ----
function renderBanners() {
    const track = document.getElementById('promo-track');
    const dots  = document.getElementById('promo-dots');
    if (!track || !dots) return;

    if (banners.length === 0) {
        document.getElementById('promo-carousel').style.display = 'none';
        dots.style.display = 'none';
        return;
    }

    track.innerHTML = banners.map(b => `
        <div class="promo-slide" style="background: linear-gradient(135deg, ${b.color} 0%, ${lightenColor(b.color, 20)} 100%);">
            <h2>${b.title}</h2>
            <p>${b.subtitle}</p>
        </div>
    `).join('');

    dots.innerHTML = banners.map((_, i) => `
        <button class="promo-dot ${i === 0 ? 'active' : ''}" data-slide="${i}"></button>
    `).join('');

    dots.querySelectorAll('.promo-dot').forEach(dot => {
        dot.onclick = () => goToSlide(parseInt(dot.dataset.slide));
    });
}

function goToSlide(i) {
    currentSlide = i;
    const track = document.getElementById('promo-track');
    if (track) track.style.transform = `translateX(-${i * 100}%)`;
    document.querySelectorAll('.promo-dot').forEach((d, idx) => d.classList.toggle('active', idx === i));
}

function startCarousel() {
    if (banners.length <= 1) return;
    setInterval(() => {
        currentSlide = (currentSlide + 1) % banners.length;
        goToSlide(currentSlide);
    }, 5000);
}

function lightenColor(hex, percent) {
    const num = parseInt(hex.replace('#',''), 16);
    const r = Math.min(255, (num >> 16) + percent);
    const g = Math.min(255, ((num >> 8) & 0x00FF) + percent);
    const b = Math.min(255, (num & 0x0000FF) + percent);
    return `rgb(${r},${g},${b})`;
}

// ---- 6. CATEGORIES ----
function renderCategories() {
    const nav = document.getElementById('categories-nav');
    if (!nav) return;
    const cats = ['Todo', ...new Set(products.map(p => p.category))];
    nav.innerHTML = cats.map(c => `
        <button class="cat-pill ${c === currentCat ? 'active' : ''}" data-category="${c}">${c}</button>
    `).join('');
    nav.querySelectorAll('.cat-pill').forEach(pill => {
        pill.onclick = () => {
            currentCat = pill.dataset.category;
            renderCategories();
            renderProducts();
        };
    });
}

// ---- 7. PRODUCTS ----
function renderProducts() {
    const grid = document.getElementById('product-list');
    if (!grid) return;

    let list = products;
    if (currentCat !== 'Todo') list = list.filter(p => p.category === currentCat);
    if (searchQuery) list = list.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (list.length === 0) {
        grid.innerHTML = `<div class="empty-state"><i class="fas fa-search"></i><p>No se encontraron productos.</p></div>`;
        return;
    }

    grid.innerHTML = list.map(p => {
        const inCart = cart.find(c => c.id === p.id);
        const finalImgUrl = getDirectImageUrl(p.img); // Google Drive Fix
        return `
        <div class="product-card" id="card-${p.id}">
            <img src="${finalImgUrl}" alt="${p.name}" class="card-img" onerror="this.src='https://placehold.co/600x400/f3eeea/a89e96?text=${encodeURIComponent(p.name)}'">
            <div class="card-body">
                <h3>${p.name}</h3>
                <p class="desc">${p.desc}</p>
                <div class="card-footer">
                    <span class="card-price">$${p.price.toLocaleString('es-AR')}</span>
                    ${inCart ? `
                        <div class="qty-control">
                            <button onclick="changeQty(${p.id},-1)"><i class="fas fa-minus"></i></button>
                            <span>${inCart.qty}</span>
                            <button onclick="changeQty(${p.id},1)"><i class="fas fa-plus"></i></button>
                        </div>
                    ` : `
                        <button class="btn-add" onclick="addItem(${p.id})"><i class="fas fa-plus"></i></button>
                    `}
                </div>
                ${inCart ? `
                    <input type="text" class="note-input" placeholder="✏️ Aclaración (ej: sin picante)" 
                           value="${inCart.note || ''}" 
                           oninput="updateNote(${p.id}, this.value)">
                ` : ''}
            </div>
        </div>`;
    }).join('');
}

// ---- 8. CART LOGIC ----
function addItem(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    cart.push({ ...p, qty: 1, note: '' });
    toast(`${p.name} agregado ✓`);
    refresh();
}

function changeQty(id, delta) {
    const item = cart.find(c => c.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
        cart = cart.filter(c => c.id !== id);
        toast('Producto removido');
    }
    refresh();
}

function updateNote(id, text) {
    const item = cart.find(c => c.id === id);
    if (item) item.note = text;
}

function refresh() {
    renderProducts();
    const qty   = cart.reduce((a, c) => a + c.qty, 0);
    const total = cart.reduce((a, c) => a + c.price * c.qty, 0);

    const bar   = document.getElementById('cart-float');
    const badge = document.getElementById('header-badge');

    if (qty > 0) {
        bar.classList.add('visible');
        badge.classList.add('show');
        badge.innerText = qty;
        document.getElementById('cart-qty').innerText = qty;
        document.getElementById('cart-total').innerText = total.toLocaleString('es-AR');
    } else {
        bar.classList.remove('visible');
        badge.classList.remove('show');
    }
}

// ---- 9. CHECKOUT ----
function openCheckout() {
    const ov = document.getElementById('checkout-overlay');
    ov.classList.add('open');

    const total = cart.reduce((a, c) => a + c.price * c.qty, 0);
    document.getElementById('checkout-total').innerText = total.toLocaleString('es-AR');

    document.getElementById('checkout-items').innerHTML = cart.map(item => `
        <div class="order-item">
            <img src="${item.img}" alt="" onerror="this.src='https://placehold.co/50x50/f3eeea/a89e96?text=?'">
            <div class="item-info">
                <h4>${item.name} × ${item.qty}</h4>
                ${item.note ? `<div class="item-note">📝 ${item.note}</div>` : ''}
                <span>$${item.price.toLocaleString('es-AR')} c/u</span>
            </div>
            <div class="item-price">$${(item.price * item.qty).toLocaleString('es-AR')}</div>
        </div>
    `).join('');
}

// ---- 10. FORM VALIDATION ----
function validateForm() {
    const name  = document.getElementById('cust-name');
    const phone = document.getElementById('cust-phone');
    const delivery = document.getElementById('cust-delivery').value;
    const addr  = document.getElementById('cust-address');
    let ok = true;

    // Name
    if (name.value.trim().length < 3) {
        name.style.borderColor = '#e74c3c';
        ok = false;
    } else {
        name.style.borderColor = '';
    }

    // Phone: only digits, 10-13 chars
    const phoneClean = phone.value.replace(/\D/g, '');
    if (phoneClean.length < 10 || phoneClean.length > 13) {
        phone.style.borderColor = '#e74c3c';
        ok = false;
    } else {
        phone.value = phoneClean;
        phone.style.borderColor = '';
    }

    // Address if delivery
    if (delivery === 'delivery' && (!addr || addr.value.trim().length < 5)) {
        if (addr) addr.style.borderColor = '#e74c3c';
        ok = false;
    } else {
        if (addr) addr.style.borderColor = '';
    }

    return ok;
}

// ---- 11. MAP LOGIC ----
function initMap() {
    if (map) {
        setTimeout(() => map.invalidateSize(), 100);
        return;
    }
    
    document.getElementById('map').style.display = 'block';
    
    map = L.map('map').setView([currentLat, currentLng], 14);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    marker = L.marker([currentLat, currentLng], {draggable: true}).addTo(map);

    marker.on('dragend', function(e) {
        const pos = marker.getLatLng();
        currentLat = pos.lat;
        currentLng = pos.lng;
        reverseGeocode(pos.lat, pos.lng);
    });
}

async function reverseGeocode(lat, lng) {
    document.getElementById('cust-address').placeholder = "Buscando dirección...";
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await res.json();
        if (data && data.display_name) {
            // Simplify address
            const parts = data.display_name.split(',');
            const simpleArr = parts.slice(0, 2).map(p => p.trim());
            document.getElementById('cust-address').value = simpleArr.join(', ');
        }
    } catch (e) {
        console.error("Geocoding failed", e);
        document.getElementById('cust-address').placeholder = "No se pudo obtener la dirección automatica.";
    }
}

// ---- 12. WHATSAPP SUBMIT ----
function submitOrder(e) {
    e.preventDefault();
    if (!validateForm()) {
        toast('⚠️ Revisá los campos marcados en rojo');
        return;
    }

    const name     = document.getElementById('cust-name').value.trim();
    const phone    = document.getElementById('cust-phone').value.trim();
    const delivery = document.getElementById('cust-delivery').value;
    const address  = document.getElementById('cust-address')?.value?.trim() || '';
    const payment  = document.getElementById('cust-payment').value;
    const total    = cart.reduce((a, c) => a + c.price * c.qty, 0);
    const orderId  = `${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${String(Date.now()).slice(-6)}`;

    // Build message with plain text symbols (no emojis to ensure compatibility)
    let msg = `=== *Pedido Bocado* ===\n\n`;
    cart.forEach(item => {
        msg += `${item.name.toUpperCase()} x${item.qty} - $${(item.price * item.qty).toLocaleString('es-AR')}`;
        if (item.note) msg += ` _(${item.note})_`;
        msg += `\n`;
    });

    msg += `\n$$$ *Total: $${total.toLocaleString('es-AR')}* $$$\n\n`;
    msg += `>> Nombre: ${name}\n`;
    msg += `>> Teléfono: ${phone}\n`;
    msg += `>> Dirección: ${delivery === 'delivery' ? address : 'Paso a Retirar'}\n`;
    if (delivery === 'delivery') {
        msg += `>> Mapa: https://maps.google.com/?q=${currentLat},${currentLng}\n`;
    }
    msg += `>> Forma de pago: ${payment}\n`;
    msg += `>> Sucursal: Sarmiento 941\n`;
    msg += `>> Pedido: ${orderId}\n\n`;

    // Receipt data as Base64
    const receiptPayload = {
        id: orderId, name, phone, total, payment, delivery,
        address: delivery === 'delivery' ? address : 'Paso a Retirar',
        items: cart.map(c => ({ n: c.name, q: c.qty, p: c.price, note: c.note || '' }))
    };
    const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(receiptPayload))));
    const baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
    const receiptUrl = `${baseUrl}receipt.html?data=${b64}`;

    msg += `🖨️ *Ver e imprimir:*\n${receiptUrl}`;

    const shopNum = '543815692499';
    window.open(`https://wa.me/${shopNum}?text=${encodeURIComponent(msg)}`, '_blank');
}

// ---- 13. EVENTS ----
function setupEvents() {
    document.getElementById('search-input')?.addEventListener('input', e => {
        searchQuery = e.target.value;
        renderProducts();
    });

    document.getElementById('open-checkout')?.addEventListener('click', openCheckout);
    document.getElementById('cart-header-btn')?.addEventListener('click', () => {
        if (cart.length > 0) openCheckout();
    });

    document.getElementById('close-checkout')?.addEventListener('click', () => {
        document.getElementById('checkout-overlay').classList.remove('open');
    });

    document.getElementById('cust-delivery')?.addEventListener('change', e => {
        const isDelivery = e.target.value === 'delivery';
        const grp = document.getElementById('address-group');
        grp.style.display = isDelivery ? 'block' : 'none';
        if (isDelivery) {
            document.getElementById('map').style.display = 'block';
            setTimeout(initMap, 300); // Give overlay time to render
        } else {
            document.getElementById('map').style.display = 'none';
        }
    });

    // Phone: block non-numeric input
    document.getElementById('cust-phone')?.addEventListener('keypress', e => {
        if (!/[0-9]/.test(e.key)) e.preventDefault();
    });

    document.getElementById('checkout-form')?.addEventListener('submit', submitOrder);
}

// ---- 14. TOAST ----
function toast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    document.getElementById('toast-msg').innerText = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2200);
}

// ---- START ----
init();
