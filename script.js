/* =========================================
   1. CORE INTERACTION & BACKGROUND (Existing)
   ========================================= */

// Mobile Menu Toggle (Existing)
const mobileMenu = document.getElementById('mobile-menu');
const navLinks = document.querySelector('.nav-links');

mobileMenu.addEventListener('click', () => {
    navLinks.classList.toggle('active');
});

document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
    });
});

// Animated Candlestick Background Canvas (Existing)
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Candlestick {
    constructor(x) {
        this.x = x;
        this.y = Math.random() * canvas.height;
        this.height = Math.random() * 80 + 20;
        this.wickHeight = this.height + Math.random() * 40 + 10;
        this.isGreen = Math.random() > 0.45;
        this.speed = Math.random() * 0.5 + 0.2;
    }
    update() {
        this.x -= this.speed;
        if (this.x < -30) {
            this.x = canvas.width + 30;
            this.y = Math.random() * canvas.height;
            this.isGreen = Math.random() > 0.45;
        }
    }
    draw() {
        ctx.strokeStyle = this.isGreen ? '#00ff88' : '#ff2a2a';
        ctx.fillStyle = this.isGreen ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 42, 42, 0.3)';
        ctx.lineWidth = 2;

        // Wick
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.wickHeight / 2);
        ctx.lineTo(this.x, this.y + this.wickHeight / 2);
        ctx.stroke();

        // Body
        ctx.fillRect(this.x - 6, this.y - this.height / 2, 12, this.height);
        ctx.strokeRect(this.x - 6, this.y - this.height / 2, 12, this.height);
    }
}

const candles = [];
for (let i = 0; i < Math.floor(window.innerWidth / 80); i++) {
    candles.push(new Candlestick(i * 80 + Math.random() * 40));
}

function animateBackground() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    candles.forEach(candle => {
        candle.update();
        candle.draw();
    });
    requestAnimationFrame(animateBackground);
}
animateBackground();

/* =========================================
   2. TRADING DATA SIMULATION (Existing)
   ========================================= */

// Real-Time Forex Pairs Simulation (Existing)
const forexPairs = [
    { name: 'EUR/USD', bid: 1.0845, ask: 1.0847, change: '+0.24%' },
    { name: 'GBP/USD', bid: 1.2632, ask: 1.2635, change: '-0.12%' },
    { name: 'USD/JPY', bid: 151.82, ask: 151.84, change: '+0.51%' },
    { name: 'AUD/USD', bid: 0.6521, ask: 0.6523, change: '+0.08%' },
    { name: 'USD/CHF', bid: 0.9015, ask: 0.9018, change: '-0.34%' },
    { name: 'NZD/USD', bid: 0.5982, ask: 0.5985, change: '+0.15%' }
];

const tableBody = document.getElementById('forex-table-body');

function renderForexTable() {
    // Check if the table body exists (crucial for multi-page PWA structure)
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    forexPairs.forEach(pair => {
        const isUp = pair.change.startsWith('+');
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${pair.name}</strong></td>
            <td>${pair.bid.toFixed(pair.name.includes('JPY') ? 2 : 4)}</td>
            <td>${pair.ask.toFixed(pair.name.includes('JPY') ? 2 : 4)}</td>
            <td class="${isUp ? 'trend-up' : 'trend-down'}">${pair.change}</td>
            <td><i class="fas fa-caret-${isUp ? 'up trend-up' : 'down trend-down'}"></i></td>
        `;
        tableBody.appendChild(row);
    });
}
renderForexTable();

// Periodically fluctuate prices to simulate real-time market (Existing)
setInterval(() => {
    forexPairs.forEach(pair => {
        const delta = (Math.random() - 0.48) * (pair.name.includes('JPY') ? 0.05 : 0.0005);
        pair.bid += delta;
        pair.ask += delta;
    });
    renderForexTable();
}, 2500);

// Real-Time World Clocks (Asia/Tokyo, London, New York)
function updateClocks() {
    // 1. Check if the IDs exist on this page (essential for tools subpages)
    const tokEl = document.getElementById('clock-asia');
    const lonEl = document.getElementById('clock-london');
    const nyEl = document.getElementById('clock-newyork');

    if (!tokEl || !lonEl || !nyEl) return;

    const now = new Date();

    // Asia (Tokyo Time - UTC+9) (Existing)
    const optionsTokyo = { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    const timeTokyo = new Intl.DateTimeFormat('en-GB', optionsTokyo).format(now);
    tokEl.textContent = timeTokyo;
    
    const tokyoHour = parseInt(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tokyo', hour: 'numeric', hour12: false }).format(now));
    const statusAsia = document.getElementById('status-asia');
    if (tokyoHour >= 9 && tokyoHour < 18) {
        statusAsia.textContent = 'OPEN';
        statusAsia.className = 'session-status status-open';
    } else {
        statusAsia.textContent = 'CLOSED';
        statusAsia.className = 'session-status status-closed';
    }

    // London Time (UTC+0 / UTC+1) (Existing)
    const optionsLondon = { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    const timeLondon = new Intl.DateTimeFormat('en-GB', optionsLondon).format(now);
    lonEl.textContent = timeLondon;
    
    const londonHour = parseInt(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: 'numeric', hour12: false }).format(now));
    const statusLondon = document.getElementById('status-london');
    if (londonHour >= 8 && londonHour < 17) {
        statusLondon.textContent = 'OPEN';
        statusLondon.className = 'session-status status-open';
    } else {
        statusLondon.textContent = 'CLOSED';
        statusLondon.className = 'session-status status-closed';
    }

    // New York Time (EST/EDT) (Existing)
    const optionsNY = { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    const timeNY = new Intl.DateTimeFormat('en-GB', optionsNY).format(now);
    nyEl.textContent = timeNY;
    
    const nyHour = parseInt(new Intl.DateTimeFormat('en-GB', { timeZone: 'America/New_York', hour: 'numeric', hour12: false }).format(now));
    
    // Standardized to match the HTML ID 'status-newyork'
    const statusNY = document.getElementById('status-newyork');
    
    if (nyHour >= 8 && nyHour < 17) {
        statusNY.textContent = 'OPEN';
        statusNY.className = 'session-status status-open';
    } else {
        statusNY.textContent = 'CLOSED';
        statusNY.className = 'session-status status-closed';
    }
}

setInterval(updateClocks, 1000);
updateClocks();

/* =========================================
   3. FORM HANDLER (Existing)
   ========================================= */

// Contact Form Handler (Existing)
const contactForm = document.getElementById('contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Thank you! Your inquiry has been dispatched to contact@dollaraddicttrading.io.');
        contactForm.reset();
    });
}

/* =========================================
   4. NEW PWA APPLICATION PROMPT (Integrated)
   ========================================= */

// Pillar 2 logic: Managing the Custom Installation Experience
let deferredPrompt;
const installPanel = document.getElementById('pwa-install-container');
const installBtn = document.getElementById('pwa-install-btn');

// A. Capture the native 'beforeinstallprompt' event (requiring sw.js activation)
window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the browser's automatic minimal install prompt (Chrome 76+)
    e.preventDefault();
    
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
    
    // B. Reveal the custom DA application showcase panel
    installPanel.style.display = 'block';
    console.log("DA PWA: Installation event captured. Showing custom prompt.");
});

// C. Listen for user interaction with the custom download button
if (installBtn) {
    installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            // Show the native browser install prompt to the user
            deferredPrompt.prompt();
            
            // D. Wait for the user to respond to the prompt
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`DA PWA: User response to install: ${outcome}`);
            
            // Clear the deferred prompt (it can only be used once)
            deferredPrompt = null;
            
            // E. Hide the custom advertising panel
            installPanel.style.display = 'none';
        }
    });
}

// Optional: Gracefully handle direct installation via browser menu
window.addEventListener('appinstalled', (evt) => {
    console.log('DA PWA: Application was successfully installed (via custom or native prompt).');
    installPanel.style.display = 'none';
});