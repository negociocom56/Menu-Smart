// =============================================
// BOCADO v3 — Complete Application Logic
// =============================================

// ---- 1. SEED DATA: Products ----
export const SEED_PRODUCTS = [
    // ... tus productos
];

// ---- 2. SEED DATA: Promo Banners ----
export const SEED_BANNERS = [
    // ... tus banners
];

// ---- 3. STATE ----
let products = JSON.parse(localStorage.getItem('bocado_products')) || SEED_PRODUCTS;
let banners = JSON.parse(localStorage.getItem('bocado_banners')) || SEED_BANNERS;
let schedules = JSON.parse(localStorage.getItem('bocado_schedules')) || [];
let cart = [];
let currentCat = 'Todo';
let searchQuery = '';
let currentSlide = 0;

// Map Variables
let map = null;
let marker = null;
let currentLat = -26.830419; // Default center (Tucuman)
let currentLng = -65.203794;

// ===================================================
// CONFIGURACIÓN MAESTRA (Sólo para Synergy Dev)
// ===================================================
const CLOUD_URL = 'https://script.google.com/macros/s/AKfycbwVXPXZGGMozf2E213UnxdmlBwr9TSX2cmkCxMXgpZpO9zNo6DrWYzd7-5MM050jOyJ/exec'; // Pega aquí tu URL de Google Apps Script (terminada en /exec)
// ===================================================

// ---- 4. INIT ----
async function init() {
    renderBanners();
    renderCategories();
    renderProducts();
    setupEvents();
    startCarousel();

    // Intentar carga desde la nube si hay URL configurada
    if (CLOUD_URL) {
        await syncFromCloud();
    }
}

async function syncFromCloud() {
    try {
        const res = await fetch(CLOUD_URL);
        const data = await res.json();
        if (data.products) {
            products = data.products;
            localStorage.setItem('bocado_products', JSON.stringify(products));
        }
        if (data.banners) {
            banners = data.banners;
            localStorage.setItem('bocado_banners', JSON.stringify(banners));
        }
        if (data.schedules) {
            schedules = data.schedules;
            localStorage.setItem('bocado_schedules', JSON.stringify(schedules));
        }
        renderBanners();
        renderCategories();
        renderProducts();
    } catch (e) {
        console.error("Cloud Sync Error:", e);
    }
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
    const dots = document.getElementById('promo-dots');
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
    const num = parseInt(hex.replace('#', ''), 16);
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
        const inCart = cart.find(c => String(c.id) === String(p.id));
        const finalImgUrl = getDirectImageUrl(p.img); // Google Drive Fix
        const isInactive = p.active === false || String(p.active).toUpperCase() === 'FALSE' || String(p.active).toUpperCase() === 'FALSO';
        const isActive = !isInactive;

        let actionHtml = '';
        if (!isActive) {
            actionHtml = `<button class="btn-add" style="width:auto;padding:0 16px;background:var(--text-muted);cursor:not-allowed;" disabled>AGOTADO</button>`;
        } else if (inCart) {
            actionHtml = `
                <div class="qty-control">
                    <button onclick="changeQty(${p.id},-1)"><i class="fas fa-minus"></i></button>
                    <span>${inCart.qty}</span>
                    <button onclick="changeQty(${p.id},1)"><i class="fas fa-plus"></i></button>
                </div>
            `;
        } else {
            actionHtml = `<button class="btn-add" onclick="addItem(${p.id})"><i class="fas fa-plus"></i></button>`;
        }

        return `
        <div class="product-card" id="card-${p.id}" style="${!isActive ? 'opacity:0.6;' : ''}">
            <span class="cat-badge" style="${!isActive ? 'background:var(--text-muted);' : ''}">${!isActive ? 'AGOTADO' : p.category}</span>
            <img src="${finalImgUrl}" alt="${p.name}" class="card-img" style="${!isActive ? 'filter:grayscale(1);' : ''}" onerror="this.src='https://placehold.co/600x400/f3eeea/a89e96?text=${encodeURIComponent(p.name)}'">
            <div class="card-body">
                <h3>${p.name}</h3>
                <p class="desc">${p.desc}</p>
                <div class="card-footer">
                    <span class="card-price" style="${!isActive ? 'color:var(--text-muted);' : ''}">$${p.price.toLocaleString('es-AR')}</span>
                    ${actionHtml}
                </div>
                ${inCart && isActive ? `
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
    const p = products.find(x => String(x.id) === String(id));
    if (!p) return;
    cart.push({ ...p, qty: 1, note: '' });
    toast(`${p.name} agregado ✓`);
    refresh();
}

function changeQty(id, delta) {
    const item = cart.find(c => String(c.id) === String(id));
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
        cart = cart.filter(c => String(c.id) !== String(id));
        toast('Producto removido');
    }
    refresh();
}

function updateNote(id, text) {
    const item = cart.find(c => String(c.id) === String(id));
    if (item) item.note = text;
}

function refresh() {
    renderProducts();
    const qty = cart.reduce((a, c) => a + c.qty, 0);
    const total = cart.reduce((a, c) => a + c.price * c.qty, 0);

    const bar = document.getElementById('cart-float');
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
    // === CIERRE AUTOMÁTICO (Hora Argentina) ===
    const now = new Date();
    const argTimeStr = now.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' });
    const argDate = new Date(argTimeStr); // Parse as local to extract hours/minutes

    if (argDate.getHours() < 10 || argDate.getHours() > 15 || (argDate.getHours() === 15 && argDate.getMinutes() >= 30)) {
        toast('El local se encuentra cerrado. (Abre a las 10:00)');
        return;
    }

    const ov = document.getElementById('checkout-overlay');
    ov.classList.add('open');

    // Populate Schedules
    const timeSelect = document.getElementById('cust-time');
    if (timeSelect) {
        const activeSchedules = schedules.filter(s => s.active !== false);
        if (activeSchedules.length > 0) {
            timeSelect.innerHTML = '<option value="">Seleccioná un horario...</option>' +
                activeSchedules.map(s => `<option value="${s.time}">${s.time}</option>`).join('');
        } else {
            timeSelect.innerHTML = '<option value="">Sin horarios disponibles hoy</option>';
        }
    }

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
    const name = document.getElementById('cust-name');
    const phone = document.getElementById('cust-phone');
    const delivery = document.getElementById('cust-delivery').value;
    const addr = document.getElementById('cust-address');
    const time = document.getElementById('cust-time');
    let ok = true;

    // Time
    if (time && time.value === '') {
        time.style.borderColor = '#e74c3c';
        ok = false;
    } else if (time) {
        time.style.borderColor = '';
    }

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

    marker = L.marker([currentLat, currentLng], { draggable: true }).addTo(map);

    marker.on('dragend', function (e) {
        const pos = marker.getLatLng();
        currentLat = pos.lat;
        currentLng = pos.lng;
        reverseGeocode(pos.lat, pos.lng);
    });
}

// ---- 11.1 ADDRESS SEARCH (GEOCODING) ----
let searchTimer = null;
async function searchAddress(query) {
    if (!query || query.length < 5) return;

    // Debounce to avoid hitting API too hard
    clearTimeout(searchTimer);
    searchTimer = setTimeout(async () => {
        try {
            // Append city for better results if user doesn't provide it
            const fullQuery = query.includes('Tucuman') ? query : `${query}, San Miguel de Tucumán`;
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullQuery)}&limit=1`);
            const data = await res.json();

            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);

                currentLat = lat;
                currentLng = lon;

                if (map && marker) {
                    map.setView([lat, lon], 16);
                    marker.setLatLng([lat, lon]);
                }
            }
        } catch (e) {
            console.error("Geocoding failed", e);
        }
    }, 800);
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

    const name = document.getElementById('cust-name').value.trim();
    const phone = document.getElementById('cust-phone').value.trim();
    const delivery = document.getElementById('cust-delivery').value;
    const address = document.getElementById('cust-address')?.value?.trim() || '';
    const timeRaw = document.getElementById('cust-time')?.value || '';
    const paymentRaw = document.getElementById('cust-payment').value;
    const paymentNames = {
        'EFECTIVO': 'Efectivo',
        'TRANSFERENCIA': 'Transferencia',
        'MERCADO_PAGO': 'Mercado Pago',
        'POINT': 'Tarjeta Posnet (POINT)'
    };
    const payment = paymentNames[paymentRaw] || paymentRaw;

    const total = cart.reduce((a, c) => a + c.price * c.qty, 0);
    const orderId = `${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Date.now()).slice(-6)}`;

    // Build message with plain text symbols (no emojis to ensure compatibility)
    let msg = `=== *Pedido Puro Sabor* ===\n\n`;
    cart.forEach(item => {
        msg += `${item.name.toUpperCase()} x${item.qty} - $${(item.price * item.qty).toLocaleString('es-AR')}`;
        if (item.note) msg += ` _(${item.note})_`;
        msg += `\n`;
    });

    msg += `💰 *Total: $${total.toLocaleString('es-AR')}* $$$\n\n`;
    msg += `👤 Nombre: ${name}\n`;
    msg += `📞 Teléfono: ${phone}\n`;
    msg += `🕒 Horario: ${timeRaw}\n`;
    msg += `📍 Dirección: ${delivery === 'delivery' ? address : 'Paso a Retirar'}\n`;
    if (delivery === 'delivery') {
        msg += `>> Mapa: https://maps.google.com/?q=${currentLat},${currentLng}\n`;
    }
    msg += `📱 Forma de pago: ${payment}\n\n`;
    msg += `✅ *Pedido Solicitado. ¡Muchas gracias!*`;

    const shopNum = '543813934389';
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
        const optPoint = document.getElementById('opt-point');
        const paymentSelect = document.getElementById('cust-payment');

        grp.style.display = isDelivery ? 'block' : 'none';

        if (isDelivery) {
            document.getElementById('map').style.display = 'block';
            setTimeout(initMap, 300); // Give overlay time to render
            // Hide and reset POINT if selected
            if (paymentSelect.value === 'POINT') {
                paymentSelect.value = 'EFECTIVO';
                updatePaymentNote('EFECTIVO');
            }
            optPoint.disabled = true;
            optPoint.style.display = 'none';
        } else {
            document.getElementById('map').style.display = 'none';
            optPoint.disabled = false;
            optPoint.style.display = 'block';
        }
    });

    document.getElementById('cust-payment')?.addEventListener('change', e => {
        updatePaymentNote(e.target.value);
    });

    function updatePaymentNote(method) {
        const noteBox = document.getElementById('payment-note');
        let text = '';

        if (method === 'TRANSFERENCIA') {
            text = 'ℹ️ <strong>Alias: Purosabor2025 </strong> A nombre de: NICOLAS ANTONIO KRUGER | Se procesará el pedido una vez enviado el comprobante de la transferencia realizada vía WhatsApp.';
        } else if (method === 'MERCADO_PAGO') {
            text = 'ℹ️ <strong>El pedido se procesará una vez realizado el pago a través del enlace de pago</strong> y enviado el comprobante por WhatsApp.';
        }

        if (text) {
            noteBox.innerHTML = text;
            noteBox.style.display = 'block';
        } else {
            noteBox.style.display = 'none';
        }
    }

    // Phone: block non-numeric input
    document.getElementById('cust-phone')?.addEventListener('keypress', e => {
        if (!/[0-9]/.test(e.key)) e.preventDefault();
    });

    document.getElementById('checkout-form')?.addEventListener('submit', submitOrder);

    // Address search link
    document.getElementById('cust-address')?.addEventListener('input', e => {
        searchAddress(e.target.value);
    });
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
