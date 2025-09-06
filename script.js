// Timings intro - foarte rapid doar pentru pagina principală
const INTRO_DELAYS = { toStage2: 150, toTop: 400, showSite: 600, finalize: 800 };

// Youth intro timings - modern, cinematic
const YOUTH_INTRO_DELAYS = { 
    particles: 0, 
    textReveal: 400, 
    logoMorph: 800, 
    finalBlast: 1200, 
    showSite: 1600, 
    finalize: 2000 
};

const introRoot  = document.getElementById('intro') || document.getElementById('intro-youth');
const content    = document.getElementById('content') || document.querySelector('.page') || document.body;
const siteNav    = document.querySelector('.site-nav');
const yearEl     = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

function runIntro(rootEl){
    const isMainPage = document.body.classList.contains('landing');
    const isYouthHome = rootEl.id === 'intro-youth' && window.location.pathname.includes('tineret.html');
    
    if (isMainPage) {
        runVerticalIntro(rootEl);
    } else if (isYouthHome) {
        runYouthIntro(rootEl);
    } else {
        // Pentru alte pagini, doar show direct fără intro
        content?.classList.add('show');
        siteNav?.classList.add('show');
        rootEl.setAttribute('aria-hidden', 'true');
        content?.setAttribute('aria-hidden', 'false');
        siteNav?.setAttribute('aria-hidden', 'false');
    }
}

function runVerticalIntro(rootEl){
    // Original Biserica Vertical intro
    requestAnimationFrame(() => {
        rootEl.classList.add('stage1');
        setTimeout(() => rootEl.classList.add('stage2'), INTRO_DELAYS.toStage2);
        setTimeout(() => rootEl.classList.add('toTop'),  INTRO_DELAYS.toTop);
        setTimeout(() => { content?.classList.add('show'); siteNav?.classList.add('show'); }, INTRO_DELAYS.showSite);
        setTimeout(() => {
            rootEl.classList.add('final');
            rootEl.setAttribute('aria-hidden', 'true');
            content?.setAttribute('aria-hidden', 'false');
            siteNav?.setAttribute('aria-hidden', 'false');
        }, INTRO_DELAYS.finalize);
    });
}

function runYouthIntro(rootEl){
    // Initialize particle system
    initYouthParticles();
    
    // Modern, jaw-dropping youth intro
    requestAnimationFrame(() => {
        // Phase 1: Particle explosion
        rootEl.classList.add('youth-stage1');
        
        // Phase 2: Text reveal with stagger
        setTimeout(() => {
            rootEl.classList.add('youth-stage2');
        }, YOUTH_INTRO_DELAYS.textReveal);
        
        // Phase 3: Logo morph and glow
        setTimeout(() => {
            rootEl.classList.add('youth-stage3');
        }, YOUTH_INTRO_DELAYS.logoMorph);
        
        // Phase 4: Final energy blast
        setTimeout(() => {
            rootEl.classList.add('youth-stage4');
        }, YOUTH_INTRO_DELAYS.finalBlast);
        
        // Phase 5: Show site content
        setTimeout(() => {
            content?.classList.add('show');
            siteNav?.classList.add('show');
        }, YOUTH_INTRO_DELAYS.showSite);
        
        // Phase 6: Finalize
        setTimeout(() => {
            rootEl.classList.add('youth-final');
            rootEl.setAttribute('aria-hidden', 'true');
            content?.setAttribute('aria-hidden', 'false');
            siteNav?.setAttribute('aria-hidden', 'false');
        }, YOUTH_INTRO_DELAYS.finalize);
    });
}

function initYouthParticles(){
    const canvas = document.getElementById('youthParticles');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const particles = [];
    const particleCount = 80;
    
    // Set canvas size
    function resizeCanvas(){
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Particle class
    class Particle {
        constructor(){
            this.reset();
            this.y = Math.random() * canvas.height;
        }
        
        reset(){
            this.x = Math.random() * canvas.width;
            this.y = -10;
            this.vx = (Math.random() - 0.5) * 2;
            this.vy = Math.random() * 3 + 1;
            this.size = Math.random() * 3 + 1;
            this.opacity = Math.random() * 0.8 + 0.2;
            this.color = `rgba(234, 251, 42, ${this.opacity})`;
            this.glow = Math.random() * 10 + 5;
        }
        
        update(){
            this.x += this.vx;
            this.y += this.vy;
            this.size *= 0.998;
            this.opacity *= 0.995;
            
            if (this.y > canvas.height + 10 || this.opacity < 0.01 || this.size < 0.1) {
                this.reset();
            }
        }
        
        draw(){
            ctx.save();
            ctx.globalAlpha = this.opacity;
            ctx.shadowBlur = this.glow;
            ctx.shadowColor = this.color;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
    
    // Create particles
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
    
    // Animation loop
    function animate(){
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        requestAnimationFrame(animate);
    }
    
    animate();
}

/* =========================
   YOUTH INTERACTIVE FUNCTIONALITY
   ========================= */

// Quick Join Modal
function openQuickJoin() {
    document.getElementById('quickJoinModal').classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeQuickJoin() {
    document.getElementById('quickJoinModal').classList.remove('show');
    document.body.style.overflow = '';
}

// Event actions
function confirmAttendance() {
    // Simulate API call
    const btn = event.target;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="icon">⏳</span>Se procesează...';
    btn.disabled = true;
    
    setTimeout(() => {
        btn.innerHTML = '<span class="icon">✅</span>Confirmat!';
        btn.style.background = '#4CAF50';
        
        // Update attendees count
        const attendeesCount = document.querySelector('.attendees-count');
        if (attendeesCount) {
            const currentCount = parseInt(attendeesCount.textContent.match(/\d+/)[0]);
            attendeesCount.textContent = `+${currentCount + 1} alții vin`;
        }
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
            btn.style.background = '';
        }, 3000);
    }, 1500);
}

function shareEvent() {
    if (navigator.share) {
        navigator.share({
            title: 'NIGHT OF WORSHIP - Tineret UNITED',
            text: 'Vino să trăiești o experiență incredibilă vineri la UNITED!',
            url: window.location.href
        });
    } else {
        // Fallback - copy to clipboard
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            const btn = event.target.closest('.share-btn');
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<span style="font-size:16px;">✓</span>';
            setTimeout(() => {
                btn.innerHTML = originalHTML;
            }, 2000);
        });
    }
}

function addToCalendar() {
    const event = {
        title: 'NIGHT OF WORSHIP - Tineret UNITED',
        start: '2025-03-15T19:00:00',
        end: '2025-03-15T21:30:00',
        description: 'Seară de laudă și închinare cu tinerii UNITED',
        location: 'Biserica Vertical - Sala mare'
    };
    
    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'BEGIN:VEVENT',
        `DTSTART:${event.start.replace(/[-:]/g, '').replace('T', 'T')}00Z`,
        `DTEND:${event.end.replace(/[-:]/g, '').replace('T', 'T')}00Z`,
        `SUMMARY:${event.title}`,
        `DESCRIPTION:${event.description}`,
        `LOCATION:${event.location}`,
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');
    
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'united-event.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Navigation
function navigateToPage(url) {
    window.location.href = url;
}

// Testimonials slider
let currentTestimonial = 1;
const totalTestimonials = 3;

function showTestimonial(n) {
    const testimonials = document.querySelectorAll('.testimonial');
    const dots = document.querySelectorAll('.dot');
    
    if (n > totalTestimonials) currentTestimonial = 1;
    if (n < 1) currentTestimonial = totalTestimonials;
    
    testimonials.forEach(t => t.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));
    
    if (testimonials[currentTestimonial - 1]) {
        testimonials[currentTestimonial - 1].classList.add('active');
    }
    if (dots[currentTestimonial - 1]) {
        dots[currentTestimonial - 1].classList.add('active');
    }
}

function nextTestimonial() {
    currentTestimonial++;
    showTestimonial(currentTestimonial);
}

function prevTestimonial() {
    currentTestimonial--;
    showTestimonial(currentTestimonial);
}

function currentTestimonialSet(n) {
    currentTestimonial = n;
    showTestimonial(currentTestimonial);
}

// Auto-rotate testimonials
setInterval(() => {
    if (document.querySelector('.testimonials-slider')) {
        nextTestimonial();
    }
}, 5000);

// Pulse effect for CTA button
function addPulseEffect() {
    const pulseBtn = document.querySelector('.btn-primary.pulse');
    if (pulseBtn) {
        setInterval(() => {
            pulseBtn.style.transform = 'scale(1.05)';
            setTimeout(() => {
                pulseBtn.style.transform = '';
            }, 200);
        }, 3000);
    }
}

// Quick Join Form Handler
document.addEventListener('DOMContentLoaded', () => {
    const quickJoinForm = document.getElementById('quickJoinForm');
    if (quickJoinForm) {
        quickJoinForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const formData = new FormData(quickJoinForm);
            const name = formData.get('quickName') || document.getElementById('quickName').value;
            const phone = formData.get('quickPhone') || document.getElementById('quickPhone').value;
            const age = formData.get('quickAge') || document.getElementById('quickAge').value;
            const groupInterest = document.getElementById('groupInterest').checked;
            
            // Simulate form submission
            const submitBtn = quickJoinForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Se procesează...';
            submitBtn.disabled = true;
            
            setTimeout(() => {
                submitBtn.textContent = '✓ Înregistrat cu succes!';
                submitBtn.style.background = '#4CAF50';
                
                setTimeout(() => {
                    closeQuickJoin();
                    quickJoinForm.reset();
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                    submitBtn.style.background = '';
                    
                    // Show success message
                    showNotification('Mulțumim! Te-ai înregistrat cu succes pentru următorul eveniment. Te vom contacta în curând!');
                }, 2000);
            }, 1500);
        });
    }
    
    // Initialize pulse effect
    addPulseEffect();
    
    // Close modal on outside click
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeQuickJoin();
        }
    });
    
    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeQuickJoin();
        }
    });
});

// Notification system
function showNotification(message, type = 'success') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        background: ${type === 'success' ? '#4CAF50' : '#f44336'};
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.3);
        max-width: 400px;
        font-weight: 700;
        transform: translateX(100%);
        transition: transform 300ms ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}

// Enhanced countdown with better formatting
function enhanceCountdown() {
    const countdowns = document.querySelectorAll('.countdown[data-datetime]');
    countdowns.forEach(countdown => {
        const targetDate = new Date(countdown.getAttribute('data-datetime')).getTime();
        
        const updateTimer = () => {
            const now = Date.now();
            const distance = targetDate - now;
            
            if (distance < 0) {
                countdown.innerHTML = '<div class="expired">Evenimentul a început!</div>';
                return;
            }
            
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            
            const daysEl = countdown.querySelector('[data-k="d"]');
            const hoursEl = countdown.querySelector('[data-k="h"]');
            const minutesEl = countdown.querySelector('[data-k="m"]');
            const secondsEl = countdown.querySelector('[data-k="s"]');
            
            if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
            if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
            if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
            if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');
        };
        
        updateTimer();
        setInterval(updateTimer, 1000);
    });
}

// Initialize enhanced features on page load
window.addEventListener('load', () => {
    enhanceCountdown();
    initPolls();
});

/* =========================
   POLLS FUNCTIONALITY
   ========================= */

// Poll voting system
function vote(pollName, optionValue) {
    // Check if already voted
    const hasVoted = localStorage.getItem(`voted_${pollName}`);
    if (hasVoted) {
        showNotification('Ai votat deja la acest poll!', 'warning');
        return;
    }
    
    // Mark as voted
    localStorage.setItem(`voted_${pollName}`, optionValue);
    
    // Update UI
    const pollOptions = document.querySelector(`[data-poll="${pollName}"]`);
    if (pollOptions) {
        // Mark selected option
        const selectedOption = pollOptions.querySelector(`[data-value="${optionValue}"]`);
        if (selectedOption) {
            selectedOption.classList.add('voted');
        }
        
        // Disable all options in this poll
        pollOptions.querySelectorAll('.poll-option').forEach(option => {
            option.style.pointerEvents = 'none';
            option.style.opacity = '0.8';
        });
        
        // Highlight selected
        selectedOption.style.opacity = '1';
    }
    
    // Simulate vote update (in real app this would be API call)
    setTimeout(() => {
        updatePollResults(pollName, optionValue);
        showVoteConfirmation(pollName, optionValue);
    }, 500);
}

function updatePollResults(pollName, votedOption) {
    // This would normally update from server, here we simulate it
    const pollElement = document.querySelector(`[data-poll="${pollName}"]`);
    if (!pollElement) return;
    
    // Simple simulation - increase voted option by 1
    const votedOptionElement = pollElement.querySelector(`[data-value="${votedOption}"]`);
    if (votedOptionElement) {
        const progressText = votedOptionElement.querySelector('.progress-text');
        const progressFill = votedOptionElement.querySelector('.progress-fill');
        
        if (progressText && progressFill) {
            // Extract current percentage and count
            const currentText = progressText.textContent;
            const match = currentText.match(/(\d+)%.*?(\d+)/);
            
            if (match) {
                let percentage = parseInt(match[1]);
                let count = parseInt(match[2]);
                
                // Increase count and adjust percentage slightly
                count += 1;
                percentage = Math.min(100, percentage + 2);
                
                // Update UI with animation
                progressFill.style.width = `${percentage}%`;
                progressText.textContent = `${percentage}% (${count} voturi)`;
            }
        }
    }
}

function showVoteConfirmation(pollName, votedOption) {
    const modal = document.getElementById('voteModal');
    const voteDetails = document.getElementById('voteDetails');
    
    if (modal && voteDetails) {
        const optionElement = document.querySelector(`[data-poll="${pollName}"] [data-value="${votedOption}"]`);
        const optionText = optionElement ? optionElement.querySelector('strong').textContent : votedOption;
        
        voteDetails.innerHTML = `
            <strong>Poll:</strong> ${pollName.replace('-', ' ')}<br>
            <strong>Opțiunea aleasă:</strong> ${optionText}
        `;
        
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Auto-close after 3 seconds
        setTimeout(() => {
            closeVoteModal();
        }, 3000);
    }
}

function closeVoteModal() {
    const modal = document.getElementById('voteModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// Poll suggestion form
function initPolls() {
    const suggestionForm = document.getElementById('pollSuggestionForm');
    if (suggestionForm) {
        suggestionForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const title = document.getElementById('suggestionTitle').value;
            const options = document.getElementById('suggestionOptions').value;
            const category = document.getElementById('suggestionCategory').value;
            const name = document.getElementById('suggestionName').value;
            
            // Simulate form submission
            const submitBtn = suggestionForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Se trimite...';
            submitBtn.disabled = true;
            
            setTimeout(() => {
                submitBtn.textContent = '✓ Trimis cu succes!';
                submitBtn.style.background = '#4CAF50';
                
                setTimeout(() => {
                    suggestionForm.reset();
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                    submitBtn.style.background = '';
                    
                    showNotification('Mulțumim pentru sugestie! O vom evalua și o vom publica în curând.');
                }, 2000);
            }, 1500);
        });
    }
    
    // Check for existing votes and mark them
    markExistingVotes();
}

function markExistingVotes() {
    // Check localStorage for existing votes
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('voted_')) {
            const pollName = key.replace('voted_', '');
            const votedOption = localStorage.getItem(key);
            
            const pollElement = document.querySelector(`[data-poll="${pollName}"]`);
            if (pollElement) {
                const selectedOption = pollElement.querySelector(`[data-value="${votedOption}"]`);
                if (selectedOption) {
                    selectedOption.classList.add('voted');
                    
                    // Disable voting for this poll
                    pollElement.querySelectorAll('.poll-option').forEach(option => {
                        option.style.pointerEvents = 'none';
                        option.style.opacity = '0.8';
                    });
                    
                    selectedOption.style.opacity = '1';
                }
            }
        }
    }
}

// Scroll to section functionality for polls
function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        element.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }
}

/* =========================
   LOCATION PAGE FUNCTIONALITY
   ========================= */

// Location page interactions
function openDirections() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const url = `https://www.google.com/maps/dir/${lat},${lng}/Strada+Exemplu+123+București`;
            window.open(url, '_blank');
        }, () => {
            // Fallback if location is denied
            const url = `https://www.google.com/maps/dir//Strada+Exemplu+123+București`;
            window.open(url, '_blank');
        });
    } else {
        const url = `https://www.google.com/maps/dir//Strada+Exemplu+123+București`;
        window.open(url, '_blank');
    }
}

function callLocation() {
    window.location.href = 'tel:+40723456789';
}

function toggleMapView(viewType) {
    // Update active button
    const mapButtons = document.querySelectorAll('.map-btn');
    mapButtons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // In a real implementation, this would change the map type
    showNotification(`Switched to ${viewType} view`);
}

function centerMap() {
    showNotification('Map centered on location');
    // In a real implementation, this would center the map
}

function openPublicTransport() {
    const url = 'https://www.google.com/maps/dir//Strada+Exemplu+123+București/@44.4267674,26.1025384,15z/data=!4m9!4m8!1m0!1m5!1m1!1s0x0:0x0!2m2!1d26.1025384!2d44.4267674!3e3';
    window.open(url, '_blank');
}

function openGoogleMaps() {
    const url = 'https://www.google.com/maps/place/Strada+Exemplu+123,+București/@44.4267674,26.1025384,17z';
    window.open(url, '_blank');
}

function showWalkingRoute() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const url = `https://www.google.com/maps/dir/${lat},${lng}/Strada+Exemplu+123+București/data=!3m1!4b1!4m2!4m1!3e2`;
            window.open(url, '_blank');
        }, () => {
            const url = `https://www.google.com/maps/dir//Strada+Exemplu+123+București/data=!3m1!4b1!4m2!4m1!3e2`;
            window.open(url, '_blank');
        });
    } else {
        const url = `https://www.google.com/maps/dir//Strada+Exemplu+123+București/data=!3m1!4b1!4m2!4m1!3e2`;
        window.open(url, '_blank');
    }
}

function contactFirstTime() {
    const message = `Bună! Vreau să vin pentru prima dată la Tineret UNITED vineri. Mă puteți ajuta cu informații?`;
    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/40723456789?text=${encodedMessage}`;
    window.open(url, '_blank');
}

function meetTheTeam() {
    showNotification('Îți trimitem informații despre echipa noastră!');
    // This could open a modal with team member photos and descriptions
}

function keepVideoLooping(video){
    if (!video) return;
    const safePlay = () => video.play().catch(() => {});
    video.addEventListener('ended',  () => { video.currentTime = 0; safePlay(); });
    ['stalled','suspend','waiting','error'].forEach(ev => video.addEventListener(ev, safePlay));
    let last = 0, stuck = 0;
    setInterval(() => {
        if (video.paused) { safePlay(); return; }
        if (video.currentTime === last) { if (++stuck >= 2) { video.currentTime = 0; safePlay(); stuck = 0; } }
        else { stuck = 0; last = video.currentTime; }
    }, 1000);
    safePlay();
}

// Reveal-on-scroll
function initReveals(){
    const items = document.querySelectorAll('.reveal');
    if (!items.length) return;
    const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('in');
                io.unobserve(e.target);
            }
        });
    }, { threshold: 0.15 });
    items.forEach(el => io.observe(el));
}

// Contact page helpers
function initContact(){
    const form = document.getElementById('contactForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const msg = document.getElementById('formMsg');
            if (msg) msg.textContent = 'Mulțumim! Mesajul tău a fost trimis (demo).';
            form.reset();
        });
    }
    document.querySelectorAll('.copy-clip').forEach(btn => {
        btn.addEventListener('click', () => {
            const sel = btn.getAttribute('data-copy');
            const el = sel ? document.querySelector(sel) : null;
            if (!el) return;
            const val = (el.textContent || '').trim();
            navigator.clipboard?.writeText(val).then(() => {
                btn.textContent = 'Copiat!';
                setTimeout(() => btn.textContent = 'Copiază IBAN', 1400);
            });
        });
    });
}

/* =========================
   NAV: creare dinamică hamburger + meniu mobil + sticky glass
   ========================= */

/** Creează butonul hamburger și meniul mobil dacă lipsesc.
 *  Copiază link-urile din nav-ul desktop în meniul mobil. */
function ensureMobileNavMarkup(){
    if (!siteNav) return { btn: null, menu: null };

    // 1) Asigură butonul hamburger în .site-nav
    let btn = siteNav.querySelector('.hamburger');
    if (!btn) {
        btn = document.createElement('button');
        btn.className = 'hamburger';
        btn.setAttribute('aria-label', 'Deschide meniul');
        btn.setAttribute('aria-expanded', 'false');
        const mid = document.createElement('span');
        btn.appendChild(mid);
        siteNav.appendChild(btn); // după <nav>, în header
    }

    // 2) Asigură meniul mobil ca sibling după .site-nav
    let mobileMenu = document.querySelector('.mobile-menu');
    if (!mobileMenu) {
        mobileMenu = document.createElement('nav');
        mobileMenu.className = 'mobile-menu';
        mobileMenu.setAttribute('aria-label', 'Meniu mobil');
        const ul = document.createElement('ul');

        // Găsește link-urile din nav-ul desktop
        const deskLinks = siteNav.querySelectorAll('nav ul a');
        if (deskLinks.length) {
            deskLinks.forEach(a => {
                const li = document.createElement('li');
                const copy = document.createElement('a');
                copy.href = a.getAttribute('href') || '#';
                copy.textContent = (a.textContent || '').trim();

                // păstrează niște clase utile
                ['united-btn','church-btn','active'].forEach(cls => {
                    if (a.classList.contains(cls)) copy.classList.add(cls);
                });

                li.appendChild(copy);
                ul.appendChild(li);
            });
        } else {
            // fallback minimal dacă nu există nav-ul clasic
            const fallback = [
                {href:'/#acasa', text:'Acasă'},
                {href:'/program.html', text:'Program'},
                {href:'/despre.html', text:'Despre'},
                {href:'/contact.html', text:'Contact'},
            ];
            fallback.forEach(it=>{
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = it.href; a.textContent = it.text;
                li.appendChild(a); ul.appendChild(li);
            });
        }

        mobileMenu.appendChild(ul);
        siteNav.insertAdjacentElement('afterend', mobileMenu);
    }

    return { btn, menu: mobileMenu };
}

function initStickyNav(){
    if (!siteNav) return;
    const onScroll = () => {
        const y = window.scrollY || 0;
        if (y > 8) siteNav.classList.add('is-sticky');
        else siteNav.classList.remove('is-sticky');
    };
    onScroll(); // init
    window.addEventListener('scroll', onScroll, { passive: true });
}

function initMobileNav(){
    // Creează markup-ul dacă nu e deja pus în HTML
    const { btn, menu } = ensureMobileNavMarkup();

    // Chiar dacă nu avem meniul, aplicăm sticky
    initStickyNav();

    if (!btn || !menu) return; // nimic de făcut dacă nu s-au putut crea

    // Evită dublarea listener-elor dacă scriptul se evaluează de mai multe ori
    if (btn.dataset.bound === '1') return;
    btn.dataset.bound = '1';

    const openMenu = () => {
        document.body.classList.add('nav-open');
        btn.setAttribute('aria-expanded', 'true');
    };
    const closeMenu = () => {
        document.body.classList.remove('nav-open');
        btn.setAttribute('aria-expanded', 'false');
    };

    btn.addEventListener('click', () => {
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        expanded ? closeMenu() : openMenu();
    });

    // închide la click pe item
    menu.addEventListener('click', (e) => {
        if (e.target.closest('a')) closeMenu();
    });

    // închide la Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeMenu();
    });

    // închide când trecem pe desktop
    const BREAKPOINT = 980;
    let lastWidth = window.innerWidth;
    window.addEventListener('resize', () => {
        const w = window.innerWidth;
        if (lastWidth <= BREAKPOINT && w > BREAKPOINT) closeMenu();
        lastWidth = w;
    });
}

/* =========================
   Boot
   ========================= */
window.addEventListener('load', () => {
    if (introRoot) runIntro(introRoot); else { content?.classList.add('show'); siteNav?.classList.add('show'); }
    keepVideoLooping(document.getElementById('bgVideo'));
    keepVideoLooping(document.getElementById('youthVideo'));
    initReveals();
    initContact();
    initMobileNav(); // ✅ creează + pornește hamburger-ul fără a atinge HTML-ul
});

// Dev shortcut: Shift+click -> sari intro
document.addEventListener('click', (e) => {
    if (!e.shiftKey || !introRoot) return;
    introRoot.classList.add('stage2', 'toTop', 'final');
    content?.classList.add('show'); siteNav?.classList.add('show');
    introRoot.setAttribute('aria-hidden', 'true');
    content?.setAttribute('aria-hidden', 'false'); siteNav?.setAttribute('aria-hidden', 'false');
});

/* =========================
   UNITED helpers (scoped pe paginile youth)
   ========================= */
window.addEventListener('load', () => {
    // Countdown (pe tineret.html)
    document.querySelectorAll('.countdown').forEach(box => {
        const dt = box.getAttribute('data-datetime');
        if (!dt) return;
        const target = new Date(dt).getTime();
        const nums = {
            d: box.querySelector('[data-k="d"]'),
            h: box.querySelector('[data-k="h"]'),
            m: box.querySelector('[data-k="m"]'),
            s: box.querySelector('[data-k="s"]'),
        };
        const tick = () => {
            const now = Date.now();
            let diff = Math.max(0, target - now);
            const d = Math.floor(diff / 86400000); diff -= d*86400000;
            const h = Math.floor(diff / 3600000);  diff -= h*3600000;
            const m = Math.floor(diff / 60000);    diff -= m*60000;
            const s = Math.floor(diff / 1000);
            if (nums.d) nums.d.textContent = String(d).padStart(2,'0');
            if (nums.h) nums.h.textContent = String(h).padStart(2,'0');
            if (nums.m) nums.m.textContent = String(m).padStart(2,'0');
            if (nums.s) nums.s.textContent = String(s).padStart(2,'0');
        };
        tick();
        setInterval(tick, 1000);
    });

    // Filter chips (evenimente / media / grupuri)
    document.querySelectorAll('.filters').forEach(fl => {
        fl.addEventListener('click', (e) => {
            const btn = e.target.closest('.chip'); if (!btn) return;
            fl.querySelectorAll('.chip').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const f = btn.dataset.filter || 'all';

            // evenimente
            document.querySelectorAll('.event-card').forEach(card => {
                const type = card.getAttribute('data-type');
                card.style.display = (f === 'all' || f === type) ? '' : 'none';
            });
            // media
            document.querySelectorAll('.media-thumb').forEach(th => {
                const type = th.getAttribute('data-type');
                th.style.display = (f === 'all' || f === type) ? '' : 'none';
            });
            // grupuri
            document.querySelectorAll('.group-card').forEach(gc => {
                const tags = (gc.getAttribute('data-tags')||'').split(/\s+/);
                gc.style.display = (f === 'all' || tags.includes(f)) ? '' : 'none';
            });
        });
    });

    // ICS calendar download (evenimente)
    const makeICS = (title, startISO, durISO) => {
        const uid = Math.random().toString(36).slice(2) + '@united';
        const dtstart = new Date(startISO);
        const end = new Date(dtstart.getTime());
        // durISO simplu: PT2H / P3D etc.
        try {
            const m = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?)?$/.exec(durISO || '');
            if (m) {
                const d = parseInt(m[1]||0,10); const h=parseInt(m[2]||0,10); const mm=parseInt(m[3]||0,10);
                end.setDate(end.getDate() + d); end.setHours(end.getHours()+h); end.setMinutes(end.getMinutes()+mm);
            }
        } catch {}
        const pad = n => String(n).padStart(2,'0');
        const fmt = (d) => d.getUTCFullYear() + pad(d.getUTCMonth()+1) + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + 'Z';
        const ics = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'BEGIN:VEVENT',
            'UID:'+uid,
            'DTSTAMP:'+fmt(new Date()),
            'DTSTART:'+fmt(dtstart),
            'DTEND:'+fmt(end),
            'SUMMARY:'+ (title||'Eveniment UNITED'),
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\r\n');
        const blob = new Blob([ics], {type:'text/calendar'});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = (title||'eveniment')+'.ics';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(()=>URL.revokeObjectURL(a.href), 500);
    };
    document.querySelectorAll('.add-ics').forEach(btn=>{
        btn.addEventListener('click', () => {
            makeICS(btn.dataset.title, btn.dataset.dt, btn.dataset.dur || 'PT2H');
        });
    });

    // Join group modal (grupuri)
    const joinModal = document.getElementById('joinModal');
    if (joinModal && joinModal.showModal) {
        document.querySelectorAll('.open-join').forEach(b=>{
            b.addEventListener('click', ()=>{
                document.getElementById('joinGroupName').textContent = b.dataset.group || '';
                document.getElementById('joinMsg').textContent = '';
                joinModal.showModal();
            });
        });
        joinModal.addEventListener('close', ()=>{});
        joinModal.querySelector('.join-form')?.addEventListener('submit', (e)=>{
            e.preventDefault();
            document.getElementById('joinMsg').textContent = 'Mulțumim! Te contactăm în curând. (demo)';
            setTimeout(()=> joinModal.close(), 1000);
        });
    }

    // Lightbox (media) — doar pentru imagini; pentru YouTube deschidem în alt tab
    const lb = document.getElementById('lightbox');
    if (lb) {
        const img = lb.querySelector('img');
        const close = () => { lb.classList.remove('show'); lb.setAttribute('aria-hidden','true'); img.src=''; };
        lb.querySelector('.close').addEventListener('click', close);
        lb.addEventListener('click', (e)=>{ if(e.target === lb) close(); });
        document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') close(); });

        document.querySelectorAll('.media-thumb').forEach(a=>{
            a.addEventListener('click', (e)=>{
                const href = a.getAttribute('href') || '';
                if (/^https?:\/\//i.test(href)) return; // ex: YouTube
                e.preventDefault();
                img.src = href;
                lb.classList.add('show'); lb.setAttribute('aria-hidden','false');
            });
        });
    }

    // Voluntariat submit (demo)
    const sv = document.getElementById('svSubmit');
    if (sv) {
        sv.addEventListener('click', ()=>{
            const roles = Array.from(document.querySelectorAll('.serve-opt input:checked')).map(i=>i.value);
            const name = document.getElementById('svName').value.trim();
            const tel  = document.getElementById('svPhone').value.trim();
            const em   = document.getElementById('svMail').value.trim();
            const msg  = document.getElementById('svMsg');
            if (!name || !tel || !em || roles.length===0) { msg.textContent = 'Completează toate câmpurile și alege cel puțin un rol.'; return; }
            msg.textContent = 'Mulțumim! Te contactăm în curând. (demo)';
        });
    }
});
