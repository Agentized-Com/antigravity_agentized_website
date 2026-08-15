document.addEventListener('DOMContentLoaded', () => {

    /* ---------- Announcement bar dismissal (30-day localStorage) ---------- */
    const announcement = document.querySelector('.announcement-bar');
    if (announcement) {
        const DISMISS_KEY = 'agentized_announcement_dismissed_at';
        const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
        const dismissedAt = localStorage.getItem(DISMISS_KEY);
        if (dismissedAt && (Date.now() - Number(dismissedAt) < THIRTY_DAYS)) {
            announcement.style.display = 'none';
        }
        const closeBtn = announcement.querySelector('.announcement-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                announcement.style.display = 'none';
                localStorage.setItem(DISMISS_KEY, String(Date.now()));
            });
        }
    }

    /* ---------- Mobile menu toggle ---------- */
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    if (mobileBtn && navLinks) {
        mobileBtn.addEventListener('click', () => {
            const isOpen = navLinks.classList.toggle('active');
            mobileBtn.setAttribute('aria-expanded', String(isOpen));
            const spans = mobileBtn.querySelectorAll('span');
            spans[0].style.transform = isOpen ? 'rotate(45deg) translate(4px, 5px)' : 'none';
            spans[1].style.opacity = isOpen ? '0' : '1';
            spans[2].style.transform = isOpen ? 'rotate(-45deg) translate(4px, -5px)' : 'none';
        });
    }

    /* ---------- Sticky header surface after hero ---------- */
    const navbar = document.querySelector('.navbar');
    const hero = document.querySelector('.hero, .page-hero');
    if (navbar) {
        const applyScrollState = () => {
            if (window.scrollY > 40) {
                navbar.classList.add('is-scrolled');
            } else {
                navbar.classList.remove('is-scrolled');
            }
        };
        applyScrollState();
        window.addEventListener('scroll', applyScrollState, { passive: true });
    }

    /* ---------- Accordion (used for offer detail / FAQ style blocks) ---------- */
    document.querySelectorAll('.accordion-header').forEach((header) => {
        header.addEventListener('click', () => {
            const item = header.closest('.accordion-item');
            const isActive = item.classList.contains('active');
            item.parentElement.querySelectorAll('.accordion-item').forEach((i) => i.classList.remove('active'));
            if (!isActive) item.classList.add('active');
        });
    });

    /* ---------- Section reveal (respects prefers-reduced-motion) ---------- */
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });
        document.querySelectorAll('[data-reveal]').forEach((el) => observer.observe(el));
    } else {
        document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-visible'));
    }

    /* ---------- Play the hero handoff animation once ---------- */
    const handoff = document.querySelector('.handoff-svg');
    if (handoff && !prefersReducedMotion) {
        const playOnce = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('handoff-anim');
                    playOnce.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });
        playOnce.observe(handoff);
    }

    /* ---------- Simple submit-state UX for lead forms (FormSubmit-backed) ---------- */
    document.querySelectorAll('form[data-lead-form]').forEach((form) => {
        form.addEventListener('submit', () => {
            const btn = form.querySelector('button[type="submit"]');
            if (btn) {
                btn.textContent = 'Submitting…';
                btn.disabled = true;
            }
        });
    });
});
