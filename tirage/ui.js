/* Tirage & Équipes : interface (liste, tirages, équipes, dé 3D). La logique est dans app.js. */
        const t = Outils.i18n(window.TIRAGE_I18N);
        RandomSelector.t = t;
        Outils.initTopbar();
        Outils.applyI18n(t);

        const selector = new RandomSelector();
        let items = selector.getElements();
        let history = RandomSelector.loadJSON('tirage.drawHistory', []);

        // Message « liste vide » / « aucun tirage » : créé en DOM (jamais d'innerHTML)
        function emptyNote(key) {
            const div = document.createElement('div');
            div.className = 'empty';
            div.textContent = t(key);
            return div;
        }

        // --- Éléments DOM ---
        const valueInput = document.getElementById('valueInput');
        const addBtn = document.getElementById('addBtn');
        const resetBtn = document.getElementById('resetBtn');
        const drawOneBtn = document.getElementById('drawOneBtn');
        const drawManyBtn = document.getElementById('drawManyBtn');
        const exportBtn = document.getElementById('exportBtn');
        const importBtn = document.getElementById('importBtn');
        const shareBtn = document.getElementById('shareBtn');
        const createTeamsBtn = document.getElementById('createTeamsBtn');
        const teamCountInput = document.getElementById('teamCount');
        const itemsListDiv = document.getElementById('itemsList');
        const countItems = document.getElementById('countItems');
        const drawResultDiv = document.getElementById('drawResult');
        const pickedItemsDiv = document.getElementById('pickedItems');
        const teamsResultDiv = document.getElementById('teamsResult');
        const historyDiv = document.getElementById('drawHistory');
        const shareContainer = document.getElementById('shareContainer');
        const shareUrl = document.getElementById('shareUrl');

        // --- Effet "onde" sur les boutons ---
        document.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', function (e) {
                const rect = this.getBoundingClientRect();
                const ripple = document.createElement('span');
                ripple.className = 'ripple';
                const size = Math.max(rect.width, rect.height);
                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
                ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
                this.appendChild(ripple);
                setTimeout(() => ripple.remove(), 600);
            });
        });

        // --- Confettis ---
        function confetti() {
            const colors = ['--accent', '--accent-2', '--accent-3', '--signal', '--ok'].map(Outils.cssVar);
            for (let i = 0; i < 90; i++) {
                const c = document.createElement('div');
                c.className = 'confetti';
                c.style.left = Math.random() * 100 + 'vw';
                c.style.background = colors[Math.floor(Math.random() * colors.length)];
                c.style.animationDuration = (2 + Math.random() * 2) + 's';
                c.style.animationDelay = Math.random() * 0.4 + 's';
                c.style.transform = `rotate(${Math.random() * 360}deg)`;
                if (Math.random() > 0.5) c.style.borderRadius = '50%';
                document.body.appendChild(c);
                setTimeout(() => c.remove(), 4500);
            }
        }

        // --- Fonctions d'affichage ---
        function showMessage(type, message, highlight) {
            drawResultDiv.className = 'result-box ' + type;
            if (highlight) {
                // Le message contient des éléments saisis ou reçus par lien : toujours en texte, jamais en HTML
                const win = document.createElement('span');
                win.className = 'win';
                win.textContent = message;
                pickedItemsDiv.replaceChildren(win);
            } else {
                pickedItemsDiv.textContent = message;
            }
            clearTimeout(showMessage._t);
            showMessage._t = setTimeout(() => {
                drawResultDiv.className = 'result-box';
                pickedItemsDiv.textContent = t('draw.none');
                pickedItemsDiv.style.color = 'var(--muted)';
            }, 4000);
        }

        function bumpCount() {
            countItems.textContent = items.length;
            countItems.classList.remove('bump');
            void countItems.offsetWidth;
            countItems.classList.add('bump');
        }

        function renderList() {
            bumpCount();
            if (items.length === 0) {
                itemsListDiv.replaceChildren(emptyNote('list.empty'));
                return;
            }
            itemsListDiv.replaceChildren();
            items.forEach((value, i) => {
                const chip = document.createElement('div');
                chip.className = 'chip';
                chip.style.animationDelay = (i * 0.03) + 's';
                const label = document.createElement('span');
                label.className = 'label';
                label.textContent = value;
                label.title = t('list.edit');
                label.addEventListener('click', () => startEdit(chip, label, i));
                chip.appendChild(label);
                const btn = document.createElement('button');
                btn.className = 'remove';
                btn.textContent = '×';
                btn.onclick = () => {
                    selector.removeElement(i);
                    items = selector.getElements();
                    renderList();
                };
                chip.appendChild(btn);
                itemsListDiv.appendChild(chip);
            });
        }

        // --- Édition en direct d'un élément ---
        function startEdit(chip, label, index) {
            if (chip.querySelector('input')) return;
            const original = items[index];
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'chip-edit';
            input.value = original;
            label.replaceWith(input);
            input.focus();
            input.select();

            let done = false;
            function commit() {
                if (done) return; done = true;
                const v = input.value.trim();
                if (v && v !== original) {
                    try {
                        selector.updateElement(index, v);
                        items = selector.getElements();
                    } catch (e) {
                        showMessage('error', e.message);
                    }
                }
                renderList();
            }
            function cancel() {
                if (done) return; done = true;
                renderList();
            }
            input.addEventListener('blur', commit);
            input.addEventListener('keydown', e => {
                if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
                else if (e.key === 'Escape') { e.preventDefault(); cancel(); }
            });
        }

        function renderHistory() {
            if (history.length === 0) {
                historyDiv.replaceChildren(emptyNote('history.empty'));
                return;
            }
            historyDiv.replaceChildren();
            history.slice(-10).reverse().forEach((t, idx) => {
                const row = document.createElement('div');
                row.className = 'history-item';
                row.style.animationDelay = (idx * 0.04) + 's';
                const time = document.createElement('span');
                time.className = 'time';
                time.textContent = new Date(t.date).toLocaleTimeString();
                const vals = document.createElement('span');
                vals.className = 'vals';
                vals.textContent = t.items.join(', ');
                row.appendChild(time);
                row.appendChild(vals);
                historyDiv.appendChild(row);
            });
        }

        function renderTeams(teams, teamCount) {
            teamsResultDiv.innerHTML = '';

            const total = items.length;
            const base = Math.floor(total / teamCount);
            const remainder = total % teamCount;

            let distribution;
            if (remainder === 0) {
                distribution = t('teams.even', { teams: teamCount, size: base });
            } else {
                const bigTeams = remainder;
                const smallTeams = teamCount - remainder;
                const parts = [];
                if (bigTeams > 0) parts.push(t(bigTeams > 1 ? 'teams.groupMany' : 'teams.groupOne', { n: bigTeams, size: base + 1 }));
                if (smallTeams > 0) parts.push(t(smallTeams > 1 ? 'teams.groupMany' : 'teams.groupOne', { n: smallTeams, size: base }));
                distribution = parts.join(', ');
            }

            const info = document.createElement('div');
            info.className = 'teams-info';
            info.textContent = t('teams.summary', { total, teams: teamCount, distribution });
            teamsResultDiv.appendChild(info);

            const grid = document.createElement('div');
            grid.className = 'teams-grid';

            teams.forEach((team, i) => {
                const card = document.createElement('div');
                card.className = 'team-card';
                card.style.animationDelay = (i * 0.08) + 's';

                const h4 = document.createElement('h4');
                const name = document.createElement('span');
                name.className = 'team-name';
                name.textContent = t('teams.team', { n: i + 1 });
                const badge = document.createElement('span');
                badge.className = 'badge';
                badge.textContent = t('teams.badge', { n: team.length });
                h4.appendChild(name);
                h4.appendChild(badge);
                card.appendChild(h4);

                const ul = document.createElement('ul');
                team.forEach(value => {
                    const li = document.createElement('li');
                    li.className = 'member';
                    li.draggable = true;
                    const avatar = document.createElement('span');
                    avatar.className = 'avatar';
                    avatar.textContent = value.slice(0, 2).toUpperCase();
                    const label = document.createElement('span');
                    label.textContent = value;
                    const grip = document.createElement('span');
                    grip.className = 'grip';
                    grip.textContent = '⠿';
                    li.appendChild(avatar);
                    li.appendChild(label);
                    li.appendChild(grip);
                    ul.appendChild(li);
                });
                card.appendChild(ul);
                grid.appendChild(card);
            });

            teamsResultDiv.appendChild(grid);
            initTilt(grid);
            initDragDrop(grid);
            confetti();
        }

        // --- Effet 3D (tilt) sur les cartes d'équipe ---
        function initTilt(grid) {
            grid.querySelectorAll('.team-card').forEach(card => {
                card.addEventListener('mousemove', e => {
                    const rect = card.getBoundingClientRect();
                    const x = (e.clientX - rect.left) / rect.width - 0.5;
                    const y = (e.clientY - rect.top) / rect.height - 0.5;
                    card.style.transform = `rotateY(${x * 14}deg) rotateX(${-y * 14}deg) translateZ(0)`;
                });
                card.addEventListener('mouseleave', () => {
                    card.style.transform = 'rotateY(0) rotateX(0)';
                });
            });
        }

        // --- Drag & drop des membres entre équipes ---
        function initDragDrop(grid) {
            let dragged = null;

            grid.querySelectorAll('.member').forEach(member => {
                member.addEventListener('dragstart', e => {
                    dragged = member;
                    member.classList.add('dragging');
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', '');
                });
                member.addEventListener('dragend', () => {
                    member.classList.remove('dragging');
                    dragged = null;
                    grid.querySelectorAll('.team-card').forEach(c => c.classList.remove('drag-over'));
                    updateBadges(grid);
                });
            });

            grid.querySelectorAll('.team-card').forEach(card => {
                card.addEventListener('dragover', e => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    card.classList.add('drag-over');
                });
                card.addEventListener('dragleave', e => {
                    if (!card.contains(e.relatedTarget)) card.classList.remove('drag-over');
                });
                card.addEventListener('drop', e => {
                    e.preventDefault();
                    card.classList.remove('drag-over');
                    if (!dragged) return;
                    const ul = card.querySelector('ul');
                    ul.appendChild(dragged);
                    updateBadges(grid);
                });
            });
        }

        function updateBadges(grid) {
            grid.querySelectorAll('.team-card').forEach(card => {
                const count = card.querySelectorAll('.member').length;
                const badge = card.querySelector('.badge');
                if (badge) badge.textContent = t('teams.badge', { n: count });
            });
        }

        // --- Écouteurs d'événements ---
        function addValue() {
            try {
                const value = valueInput.value.trim();
                if (!value) throw new Error(t('err.empty'));
                selector.addElement(value);
                items = selector.getElements();
                renderList();
                valueInput.value = '';
                valueInput.focus();
            } catch (e) {
                showMessage('error', e.message);
            }
        }

        addBtn.addEventListener('click', addValue);
        valueInput.addEventListener('keydown', e => { if (e.key === 'Enter') addValue(); });

        resetBtn.addEventListener('click', () => {
            selector.resetList();
            items = selector.getElements();
            renderList();
            teamsResultDiv.innerHTML = '';
            showMessage('success', t('list.resetDone'));
        });

        drawOneBtn.addEventListener('click', () => {
            try {
                selector.drawRandom(1, true);
                history = RandomSelector.loadJSON('tirage.drawHistory', []);
                showMessage('success', `🎯 ${selector.getPicked()[0]}`, true);
                renderHistory();
            } catch (e) {
                showMessage('error', e.message);
            }
        });

        // --- Modale tirage multiple ---
        const drawModal = document.getElementById('drawModal');
        const drawModalCard = document.getElementById('drawModalCard');
        const drawCountInput = document.getElementById('drawCountInput');
        const drawCancelBtn = document.getElementById('drawCancelBtn');
        const drawConfirmBtn = document.getElementById('drawConfirmBtn');

        function openDrawModal() {
            drawCountInput.value = 3;
            drawModal.hidden = false;
            requestAnimationFrame(() => drawCountInput.focus());
        }
        function closeDrawModal() {
            drawModal.hidden = true;
        }
        function confirmDraw() {
            const count = parseInt(drawCountInput.value);
            if (!count || count < 1) return;
            closeDrawModal();
            try {
                selector.drawRandom(count, true);
                history = RandomSelector.loadJSON('tirage.drawHistory', []);
                showMessage('success', `🎯 ${selector.getPicked().join(', ')}`, true);
                renderHistory();
            } catch (e) {
                showMessage('error', e.message);
            }
        }

        drawManyBtn.addEventListener('click', openDrawModal);
        drawCancelBtn.addEventListener('click', closeDrawModal);
        drawConfirmBtn.addEventListener('click', confirmDraw);
        drawCountInput.addEventListener('keydown', e => { if (e.key === 'Enter') confirmDraw(); });
        drawModal.addEventListener('click', e => { if (e.target === drawModal) closeDrawModal(); });
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && !drawModal.hidden) closeDrawModal();
        });

        // Tilt 3D au survol de la carte de la modale
        drawModalCard.addEventListener('mousemove', e => {
            const rect = drawModalCard.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            drawModalCard.style.transform = `rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`;
        });
        drawModalCard.addEventListener('mouseleave', () => {
            drawModalCard.style.transform = 'rotateY(0) rotateX(0)';
        });

        exportBtn.addEventListener('click', () => {
            const data = selector.exportList();
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = t('list.filename');
            a.click();
            URL.revokeObjectURL(url);
        });

        importBtn.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = e => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = ev => {
                    try {
                        const count = selector.importList(ev.target.result);
                        items = selector.getElements();
                        renderList();
                        showMessage('success', t('list.imported', { n: count }));
                    } catch (err) {
                        showMessage('error', err.message);
                    }
                };
                reader.readAsText(file);
            };
            input.click();
        });

        shareBtn.addEventListener('click', () => {
            shareUrl.value = selector.generateShareLink();
            shareContainer.style.display = 'block';
            shareUrl.select();
        });

        createTeamsBtn.addEventListener('click', () => {
            try {
                const count = parseInt(teamCountInput.value);
                if (!(count >= 1)) throw new Error(t('err.teamsMin'));
                const teams = selector.generateBalancedTeams(count);
                renderTeams(teams, count);
            } catch (e) {
                showMessage('error', e.message);
            }
        });

        // --- Chargement initial ---
        const params = new URLSearchParams(window.location.search);
        const itemsUrl = params.get('items');
        if (itemsUrl) {
            itemsUrl.split(',').slice(0, RandomSelector.MAX_ITEMS).forEach(value => {
                const trimmed = value.trim();
                if (trimmed && trimmed.length <= RandomSelector.MAX_LENGTH && !items.includes(trimmed)) {
                    try { selector.addElement(trimmed); } catch (e) { /* liste pleine ou valeur refusée */ }
                }
            });
            items = selector.getElements();
        }

        renderList();
        renderHistory();

        // --- Dé 3D (Three.js) ---
        (function initDie() {
            const container = document.getElementById('die3d');
            if (!container || typeof THREE === 'undefined') {
                if (container) {
                    const fb = document.createElement('span');
                    fb.className = 'logo-fallback';
                    fb.textContent = '🎲';
                    container.appendChild(fb);
                }
                return;
            }

            const SIZE = 150;
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
            camera.position.set(0, 0, 5.2);

            const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(SIZE, SIZE);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
            container.appendChild(renderer.domElement);

            // Halo lumineux derrière le dé
            const glow = document.createElement('div');
            glow.style.cssText = 'position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb, var(--accent) 50%, transparent),transparent 65%);filter:blur(10px);z-index:-1;';
            container.style.position = 'relative';
            container.insertBefore(glow, renderer.domElement);

            // Textures des faces (pips)
            function faceTexture(n) {
                const c = document.createElement('canvas');
                c.width = c.height = 256;
                const ctx = c.getContext('2d');
                const g = ctx.createLinearGradient(0, 0, 256, 256);
                // Faces du dé aux couleurs du design system (base.css)
                g.addColorStop(0, Outils.cssVar('--accent-3'));
                g.addColorStop(0.5, Outils.cssVar('--accent'));
                g.addColorStop(1, Outils.cssVar('--accent-2'));
                ctx.fillStyle = g;
                ctx.fillRect(0, 0, 256, 256);
                const ink = Outils.cssVar('--on-color');
                ctx.strokeStyle = ink;
                ctx.globalAlpha = 0.35;
                ctx.lineWidth = 10;
                ctx.strokeRect(8, 8, 240, 240);
                ctx.globalAlpha = 1;
                const P = {
                    1: [[128, 128]],
                    2: [[72, 72], [184, 184]],
                    3: [[72, 72], [128, 128], [184, 184]],
                    4: [[72, 72], [184, 72], [72, 184], [184, 184]],
                    5: [[72, 72], [184, 72], [128, 128], [72, 184], [184, 184]],
                    6: [[72, 64], [184, 64], [72, 128], [184, 128], [72, 192], [184, 192]]
                };
                ctx.fillStyle = ink;
                (P[n] || []).forEach(([x, y]) => {
                    ctx.beginPath();
                    ctx.arc(x, y, 26, 0, Math.PI * 2);
                    ctx.fill();
                });
                const tex = new THREE.CanvasTexture(c);
                tex.anisotropy = 4;
                return tex;
            }

            const geo = new THREE.BoxGeometry(2, 2, 2, 4, 4, 4);
            const FACES = [1, 6, 3, 4, 2, 5];
            const mats = FACES.map(n => new THREE.MeshStandardMaterial({
                map: faceTexture(n),
                roughness: 0.35,
                metalness: 0.15
            }));
            const die = new THREE.Mesh(geo, mats);
            die.rotation.set(0.5, 0.7, 0);
            scene.add(die);

            scene.add(new THREE.AmbientLight(0xffffff, 0.75));
            const key = new THREE.PointLight(0xffffff, 1.1);
            key.position.set(3, 4, 5);
            scene.add(key);
            const rim = new THREE.PointLight(new THREE.Color(Outils.cssVar('--accent')), 0.8);
            rim.position.set(-4, -2, 3);
            scene.add(rim);

            // Changement de thème : on redessine les faces avec les nouvelles couleurs du design system
            document.addEventListener('outils:theme', () => {
                mats.forEach((m, i) => { m.map.dispose(); m.map = faceTexture(FACES[i]); m.needsUpdate = true; });
                rim.color.set(Outils.cssVar('--accent'));
            });

            // --- Rotation par drag + inertie + snap fluide sur une face ---
            const K = 0.012;            // radians par pixel
            const FRICTION = 0.95;      // décélération par frame
            const SETTLE_SPEED = 0.004; // seuil de vitesse pour passer au snap
            const SNAPEASE = 0.16;      // vitesse de slerp vers la face
            const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

            let mode = 'idle';          // idle | drag | spin | settle
            let vel = { x: 0, y: 0 };   // vitesse angulaire (rad/frame)
            let last = { x: 0, y: 0 };  // dernière position du pointeur
            let targetQuat = new THREE.Quaternion();
            let t = 0;

            const _q = new THREE.Quaternion();
            const _e = new THREE.Euler();
            function spinBy(ax, ay) {   // ax = axe X, ay = axe Y (radians)
                _q.setFromEuler(_e.set(ax, ay, 0));
                die.quaternion.premultiply(_q);
            }

            // Orientations cibles : amener chaque face vers la caméra (+Z)
            const FACE_TARGETS = [
                new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)),
                new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0)),
                new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI / 2, 0)),
                new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0)),
                new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)),
                new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0))
            ];
            function nearestFace() {
                let best = FACE_TARGETS[0], bestDot = -2;
                for (const f of FACE_TARGETS) {
                    const d = Math.abs(die.quaternion.dot(f));
                    if (d > bestDot) { bestDot = d; best = f; }
                }
                return best;
            }

            function animate() {
                requestAnimationFrame(animate);
                t += 0.016;

                if (mode === 'spin') {
                    spinBy(vel.x, vel.y);
                    vel.x *= FRICTION;
                    vel.y *= FRICTION;
                    if (Math.abs(vel.x) + Math.abs(vel.y) < SETTLE_SPEED) {
                        vel.x = vel.y = 0;
                        targetQuat = nearestFace();
                        mode = 'settle';
                    }
                } else if (mode === 'settle') {
                    die.quaternion.slerp(targetQuat, SNAPEASE);
                    if (die.quaternion.dot(targetQuat) > 0.9999) {
                        die.quaternion.copy(targetQuat);
                        mode = 'idle';
                    }
                }

                // flottement doux en idle, retour à 0 sinon
                const targetY = (mode === 'idle') ? Math.sin(t * 1.4) * 0.06 : 0;
                die.position.y += (targetY - die.position.y) * 0.08;

                // léger zoom pendant le drag
                const targetScale = (mode === 'drag') ? 1.08 : 1.0;
                die.scale.x += (targetScale - die.scale.x) * 0.15;
                die.scale.y = die.scale.z = die.scale.x;

                renderer.render(scene, camera);
            }
            animate();

            const el = renderer.domElement;
            el.style.cursor = 'grab';
            el.style.touchAction = 'none';

            function onDown(e) {
                mode = 'drag';
                vel.x = vel.y = 0;
                last.x = e.clientX;
                last.y = e.clientY;
                el.style.cursor = 'grabbing';
                e.preventDefault();
            }
            function onMove(e) {
                if (mode !== 'drag') return;
                const dx = e.clientX - last.x;
                const dy = e.clientY - last.y;
                last.x = e.clientX;
                last.y = e.clientY;
                spinBy(dy * K, dx * K);
                vel.x = clamp(dy * K, -0.5, 0.5);
                vel.y = clamp(dx * K, -0.5, 0.5);
            }
            function onUp() {
                if (mode !== 'drag') return;
                el.style.cursor = 'grab';
                if (Math.abs(vel.x) + Math.abs(vel.y) < SETTLE_SPEED) {
                    targetQuat = nearestFace();
                    mode = 'settle';
                } else {
                    mode = 'spin';
                }
            }

            el.addEventListener('pointerdown', onDown);
            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
        })();
    