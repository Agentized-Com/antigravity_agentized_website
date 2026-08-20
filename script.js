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

    /* ---------- Hero ambient field ----------
       Builds an explicit grid model — a labeled object per vertical line, per
       horizontal line, and per cell, each with its exact pixel coordinate —
       instead of computing positions ad hoc. A random pick then chooses one
       object from that model to blink on, hold, and blink off, on its own
       random interval and duration. Rebuilt whenever the field resizes. */
    const heroField = document.querySelector('.hero-field');
    const heroGridSvg = document.querySelector('.hero-field-grid');
    if (heroField && heroGridSvg) {
        const CELL = 34; // must match the grid line spacing this whole system is built on
        const SVG_NS = 'http://www.w3.org/2000/svg';
        const rand = (min, max) => Math.random() * (max - min) + min;
        const randInt = (min, max) => Math.floor(rand(min, max + 1));
        const pick = (arr) => arr[randInt(0, arr.length - 1)];

        let grid = { verticalLines: [], horizontalLines: [], cells: [], width: 0, height: 0 };

        // Draws the actual <line> objects the grid is made of, then derives
        // every cell as the overlap of one vertical + one horizontal line —
        // so "which grid square is this" is never a guess, it's just
        // grid.cells[i].col/row against the line ids that bound it.
        const buildGrid = () => {
            const rect = heroField.getBoundingClientRect();
            const cols = Math.max(1, Math.floor(rect.width / CELL));
            const rows = Math.max(1, Math.floor(rect.height / CELL));

            heroGridSvg.setAttribute('width', rect.width);
            heroGridSvg.setAttribute('height', rect.height);
            heroGridSvg.innerHTML = '';

            const verticalLines = [];
            for (let col = 0; col <= cols; col++) {
                const x = col * CELL;
                verticalLines.push({ id: 'v' + col, col, x });
                const lineEl = document.createElementNS(SVG_NS, 'line');
                lineEl.setAttribute('x1', x); lineEl.setAttribute('x2', x);
                lineEl.setAttribute('y1', 0); lineEl.setAttribute('y2', rect.height);
                lineEl.dataset.lineId = 'v' + col;
                heroGridSvg.appendChild(lineEl);
            }

            const horizontalLines = [];
            for (let row = 0; row <= rows; row++) {
                const y = row * CELL;
                horizontalLines.push({ id: 'h' + row, row, y });
                const lineEl = document.createElementNS(SVG_NS, 'line');
                lineEl.setAttribute('y1', y); lineEl.setAttribute('y2', y);
                lineEl.setAttribute('x1', 0); lineEl.setAttribute('x2', rect.width);
                lineEl.dataset.lineId = 'h' + row;
                heroGridSvg.appendChild(lineEl);
            }

            // each cell is bounded by verticalLines[col]/[col+1] and
            // horizontalLines[row]/[row+1] — recorded here so that's explicit,
            // not just implied by matching coordinates
            const cells = [];
            for (let col = 0; col < cols; col++) {
                for (let row = 0; row < rows; row++) {
                    cells.push({
                        id: 'c' + col + '-' + row, col, row,
                        x: col * CELL, y: row * CELL,
                        boundedBy: ['v' + col, 'v' + (col + 1), 'h' + row, 'h' + (row + 1)]
                    });
                }
            }

            // a small plus-mark drawn at every line intersection
            const CROSS = 3;
            for (let col = 0; col <= cols; col++) {
                for (let row = 0; row <= rows; row++) {
                    const x = col * CELL, y = row * CELL;
                    const crossEl = document.createElementNS(SVG_NS, 'path');
                    crossEl.setAttribute('class', 'hero-field-cross');
                    crossEl.setAttribute('d',
                        'M' + (x - CROSS) + ',' + y + ' H' + (x + CROSS) +
                        ' M' + x + ',' + (y - CROSS) + ' V' + (y + CROSS));
                    crossEl.dataset.atLines = 'v' + col + '+h' + row;
                    heroGridSvg.appendChild(crossEl);
                }
            }

            grid = { verticalLines, horizontalLines, cells, width: rect.width, height: rect.height };
        };
        buildGrid();
        window.addEventListener('resize', buildGrid);

        // the grid lines above are drawn either way (they're static, not
        // motion) — only the blinking cell/streak spawners are gated here
        if (!prefersReducedMotion) {
            // every cell is the same fixed size (CELL x CELL); duration is
            // deliberately long so the flicker-then-slow-on keyframe (see
            // heroCellBlink in style.css) has room to play out
            const spawnCell = () => {
                if (!grid.cells.length) return;
                const cell = pick(grid.cells);
                const el = document.createElement('span');
                el.className = 'hero-cell';
                el.dataset.cellId = cell.id;
                el.style.left = cell.x + 'px';
                el.style.top = cell.y + 'px';
                el.style.animationDuration = rand(3.5, 5.5) + 's';
                el.addEventListener('animationend', () => el.remove());
                heroField.appendChild(el);
            };

            // short segments, not full-length lines — travel along a random
            // line but only cover STREAK_LEN px of it, at a random offset
            const STREAK_LEN = 90;
            const spawnStreak = () => {
                const vertical = Math.random() < 0.55;
                const line = vertical ? pick(grid.verticalLines) : pick(grid.horizontalLines);
                if (!line) return;
                const el = document.createElement('span');
                el.className = 'hero-streak ' + (vertical ? 'hero-streak-v' : 'hero-streak-h');
                el.dataset.lineId = line.id;
                el.style.animationDuration = rand(0.6, 1.1) + 's';
                if (vertical) {
                    el.style.left = line.x + 'px';
                    el.style.height = STREAK_LEN + 'px';
                    el.style.top = rand(0, Math.max(0, grid.height - STREAK_LEN)) + 'px';
                } else {
                    el.style.top = line.y + 'px';
                    el.style.width = STREAK_LEN + 'px';
                    el.style.left = rand(0, Math.max(0, grid.width - STREAK_LEN)) + 'px';
                }
                el.addEventListener('animationend', () => el.remove());
                heroField.appendChild(el);
            };

            // small blinking lights sitting exactly on a random line
            // intersection — picked straight from the same vertical/
            // horizontal line objects, so it's always a real intersection
            const spawnLight = () => {
                if (!grid.verticalLines.length || !grid.horizontalLines.length) return;
                const vLine = pick(grid.verticalLines);
                const hLine = pick(grid.horizontalLines);
                const el = document.createElement('span');
                el.className = 'hero-light';
                el.dataset.atLines = vLine.id + '+' + hLine.id;
                el.style.left = vLine.x + 'px';
                el.style.top = hLine.y + 'px';
                el.style.animationDuration = rand(0.9, 1.8) + 's';
                el.addEventListener('animationend', () => el.remove());
                heroField.appendChild(el);
            };

            const scheduleCell = () => {
                spawnCell();
                setTimeout(scheduleCell, rand(250, 900));
            };
            const scheduleStreak = () => {
                spawnStreak();
                setTimeout(scheduleStreak, rand(350, 900));
            };
            const scheduleLight = () => {
                spawnLight();
                setTimeout(scheduleLight, rand(150, 500));
            };
            scheduleCell();
            scheduleStreak();
            scheduleLight();
        }
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
