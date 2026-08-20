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

    /* ---------- Play the hero handoff animation once ----------
       Deliberately runs even under prefers-reduced-motion: it's a one-shot
       sequence that conveys the actual flow order (unlike the looping
       ambient background effects below, which do respect that setting).

       Each node "builds" from real hexagon tiles — actual <polygon> elements
       created and appended to the DOM one at a time on a timer, then removed
       — the exact same technique as the .hero-cell background squares, which
       is known to render. Previous attempt pre-rendered ~200 tiles into the
       SVG source with CSS animation-delay chains timing when they became
       visible; if that never fires for any reason, nothing is visibly wrong
       until you look closely. Spawning real elements on a timer can't fail
       silently the same way — either the element exists on the timeline or
       it doesn't. */
    const handoff = document.querySelector('.handoff-svg');
    if (handoff) {
        const SVG_NS = 'http://www.w3.org/2000/svg';
        const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

        const hexPoints = (cx, cy, r) => {
            const pts = [];
            for (let i = 0; i < 6; i++) {
                const ang = (Math.PI / 180) * (60 * i - 30);
                pts.push((cx + r * Math.cos(ang)).toFixed(1) + ',' + (cy + r * Math.sin(ang)).toFixed(1));
            }
            return pts.join(' ');
        };

        // hex centers covering a box (x,y,w,h) at tile radius tr, slightly
        // overflowing the edges (fine — tiles are on screen for ~0.3s each)
        const tileCenters = (x, y, w, h, tr) => {
            const hexw = Math.sqrt(3) * tr, hexh = 2 * tr, vstep = hexh * 0.75;
            const centers = [];
            let row = 0, yy = y - hexh / 2;
            while (yy < y + h + hexh / 2) {
                const xoff = (row % 2) ? hexw / 2 : 0;
                let xx = x - hexw / 2 + xoff;
                while (xx < x + w + hexw / 2) { centers.push([xx, yy]); xx += hexw; }
                yy += vstep;
                row++;
            }
            return centers;
        };

        // spawns a box's hex-tile mosaic tile by tile, waits for it to
        // finish, fades the tiles out while fading the real node in, removes
        // the tile elements once they're no longer needed
        const assembleNode = async (nodeClass, x, y, w, h, tr, color) => {
            const node = handoff.querySelector('.hf-node.' + nodeClass);
            if (!node) return;
            const group = document.createElementNS(SVG_NS, 'g');
            group.setAttribute('class', 'hf-tile-group');
            handoff.insertBefore(group, node);

            const centers = tileCenters(x, y, w, h, tr);
            const spawnSpread = 260; // ms across which tiles land
            centers.forEach(([cx, cy], i) => {
                setTimeout(() => {
                    const poly = document.createElementNS(SVG_NS, 'polygon');
                    poly.setAttribute('points', hexPoints(cx, cy, tr));
                    poly.setAttribute('fill', color);
                    poly.setAttribute('class', 'hf-tile-live');
                    group.appendChild(poly);
                }, (i / Math.max(centers.length - 1, 1)) * spawnSpread);
            });

            await wait(spawnSpread + 320); // last tile spawned + its own flip duration
            node.classList.add('is-in');
            group.style.opacity = '0';
            await wait(250);
            group.remove();
        };

        const revealLine = async (lineClass) => {
            const line = handoff.querySelector('.hf-line.' + lineClass);
            if (line) line.classList.add('is-in');
            await wait(350);
        };

        const playSequence = async () => {
            handoff.classList.add('handoff-anim');
            await assembleNode('n1', 20, 26, 300, 100, 26, '#FF6800');
            await revealLine('to-r');
            await assembleNode('n2', 390, 26, 270, 76, 22, '#10A9F4');
            await revealLine('to-p');
            await assembleNode('n3', 390, 150, 270, 76, 22, '#10A9F4');
            await revealLine('to-c');
            await assembleNode('n4', 390, 274, 270, 76, 22, '#10A9F4');
            await revealLine('to-gate');
            await assembleNode('n5', 700, 257, 260, 110, 24, '#FF6800');
            await revealLine('to-outcome');
            await assembleNode('n6', 700, 387, 260, 130, 26, '#10A9F4');
        };

        const playOnce = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    playSequence();
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

            const cellByKey = new Map(cells.map((c) => [c.col + ',' + c.row, c]));
            grid = { verticalLines, horizontalLines, cells, cellByKey, width: rect.width, height: rect.height };
        };
        buildGrid();
        window.addEventListener('resize', buildGrid);

        // the grid lines above are drawn either way (they're static, not
        // motion) — only the blinking cell/streak spawners are gated here
        if (!prefersReducedMotion) {
            // every cell is the same fixed size (CELL x CELL); duration is
            // deliberately long so the flicker-then-slow-on keyframe (see
            // heroCellBlink in style.css) has room to play out
            // mirrors the CSS mask-image on .hero-field-grid — same center,
            // same ellipse, same three stops — so a square's max brightness
            // fades the same way the background grid already fades, instead
            // of every square hitting full opacity regardless of position
            const lerp = (a, b, t) => a + (b - a) * t;
            const peakForPoint = (x, y) => {
                const cx = grid.width * 0.5, cy = grid.height * 0.42;
                const rx = grid.width * 0.70, ry = grid.height * 0.78;
                const t = Math.sqrt(Math.pow((x - cx) / rx, 2) + Math.pow((y - cy) / ry, 2));
                if (t <= 0.15) return 1;
                if (t <= 0.45) return lerp(1, 0.35, (t - 0.15) / 0.30);
                if (t <= 0.78) return lerp(0.35, 0, (t - 0.45) / 0.33);
                return 0.1; // floor so far-edge squares still faintly show, rather than spawning invisibly
            };

            const spawnCell = () => {
                if (!grid.cells.length) return;
                const cell = pick(grid.cells);
                const el = document.createElement('span');
                el.className = 'hero-cell';
                el.dataset.cellId = cell.id;
                el.style.left = cell.x + 'px';
                el.style.top = cell.y + 'px';
                el.style.setProperty('--peak', peakForPoint(cell.x, cell.y).toFixed(2));
                el.style.animationDuration = rand(3.5, 5.5) + 's';
                el.addEventListener('animationend', () => el.remove());
                heroField.appendChild(el);
            };

            // short segments, not full-length lines — travel along a random
            // a short comet starts at the line's origin and sweeps the FULL
            // length of that line (--travel = the line's actual pixel
            // length) fast, instead of sitting static partway along it
            const spawnStreak = () => {
                const vertical = Math.random() < 0.55;
                const line = vertical ? pick(grid.verticalLines) : pick(grid.horizontalLines);
                if (!line) return;
                const el = document.createElement('span');
                el.className = 'hero-streak ' + (vertical ? 'hero-streak-v' : 'hero-streak-h');
                el.dataset.lineId = line.id;
                el.style.animationDuration = rand(0.35, 0.6) + 's';
                if (vertical) {
                    el.style.left = line.x + 'px';
                    el.style.setProperty('--travel', grid.height + 'px');
                } else {
                    el.style.top = line.y + 'px';
                    el.style.setProperty('--travel', grid.width + 'px');
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
                setTimeout(scheduleCell, rand(450, 1300));
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
