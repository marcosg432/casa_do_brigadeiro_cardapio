(function () {
    var CONFIGS = {
        tradicionais: { titulo: 'Docinhos Tradicionais', unitario: 1.8 },
        belga: { titulo: 'Brigadeiros Belga', unitario: 3.5 },
        recheados: { titulo: 'Brigadeiros Recheados', unitario: 3.8 },
        especiais: { titulo: 'Brigadeiros Especiais', unitario: 4.1 },
        docesEspeciais: { titulo: 'Doces Especiais', unitario: 0 }
    };
    var active = null;
    var modal = null;

    function money(value) {
        return 'R$ ' + (Number(value) || 0).toFixed(2).replace('.', ',');
    }

    function getConfig(card) {
        var key = card.dataset.vendaCategoria || (card.classList.contains('des-card') ? 'docesEspeciais' : 'tradicionais');
        var base = CONFIGS[key] || CONFIGS.tradicionais;
        var unitario = parseFloat(card.dataset.precoUnitario || card.getAttribute('data-preco-unitario') || base.unitario);
        var preco = parseFloat(card.dataset.produtoPreco || card.getAttribute('data-produto-preco') || '0') || 0;
        var qtdMin = parseInt(String(card.dataset.produtoQtdMin || card.getAttribute('data-produto-qtd-min') || '100'), 10) || 100;
        var luxo = card.dataset.produtoLuxo === 'true' || card.getAttribute('data-produto-luxo') === 'true';
        var cento;
        if (card.dataset.precoCento != null && card.dataset.precoCento !== '') {
            cento = parseFloat(card.dataset.precoCento);
        } else if (luxo && qtdMin <= 1) {
            cento = preco;
        } else {
            cento = preco * qtdMin;
        }
        return {
            titulo: card.dataset.vendaTitulo || base.titulo,
            unitario: unitario,
            cento: Math.round(cento * 100) / 100,
            unidadesPorCento: parseInt(String(card.dataset.unidadesPorCento || '50'), 10) || 50
        };
    }

    function productName(card, cfg) {
        return (card.dataset.produtoNome || card.getAttribute('data-produto-nome') || cfg.titulo)
            .replace(/^Cento de\s+/i, '')
            .replace(/\s+—\s+Doces especiais$/i, '');
    }

    function flavors(card) {
        var list = [];
        card.querySelectorAll('.dt-sabor-pill').forEach(function (el) {
            if (el.dataset.sabor) list.push(el.dataset.sabor);
        });
        if (!list.length) {
            card.querySelectorAll('.dt-flavors-list li').forEach(function (el) {
                var text = (el.textContent || '').trim();
                if (text) list.push(text);
            });
        }
        if (!list.length && card.classList.contains('des-card')) {
            list.push(productName(card, getConfig(card)));
        }
        return list;
    }

    function ensureModal() {
        if (modal) return modal;
        modal = document.createElement('div');
        modal.className = 'pedido-luxo-modal';
        modal.setAttribute('aria-hidden', 'true');
        modal.innerHTML =
            '<div class="pedido-luxo-backdrop" data-luxo-close></div>' +
            '<section class="pedido-luxo-sheet" role="dialog" aria-modal="true" aria-labelledby="pedido-luxo-title">' +
                '<button type="button" class="pedido-luxo-close" data-luxo-close aria-label="Fechar">×</button>' +
                '<p class="pedido-luxo-kicker">Pedido guiado</p>' +
                '<h2 id="pedido-luxo-title" class="pedido-luxo-title">Escolha a forma do pedido</h2>' +
                '<div class="pedido-luxo-options" role="group" aria-label="Tipo de pedido">' +
                    '<button type="button" class="pedido-luxo-option" data-luxo-mode="unitario">' +
                        '<span class="pedido-luxo-icon">1</span><strong>Pedido por Unidade</strong><small>Escolha entre 10 e 49 unidades.</small>' +
                    '</button>' +
                    '<button type="button" class="pedido-luxo-option" data-luxo-mode="cento">' +
                        '<span class="pedido-luxo-icon">50</span><strong>Pedido por Cento</strong><small>Pedidos a partir de 50 unidades.</small>' +
                    '</button>' +
                '</div>' +
                '<div class="pedido-luxo-config" data-luxo-config hidden>' +
                    '<div class="pedido-luxo-counter">' +
                        '<button type="button" data-luxo-minus aria-label="Diminuir">−</button>' +
                        '<div><strong data-luxo-qtd>10</strong><span data-luxo-qtd-label>unidades</span></div>' +
                        '<button type="button" data-luxo-plus aria-label="Aumentar">+</button>' +
                    '</div>' +
                    '<div class="pedido-luxo-flavors" data-luxo-flavors-wrap><p>Sabores</p><div data-luxo-flavors></div></div>' +
                    '<p class="pedido-luxo-note" data-luxo-note></p>' +
                    '<div class="pedido-luxo-summary">' +
                        '<span data-luxo-summary-qtd>10 unidades</span>' +
                        '<span data-luxo-summary-flavors>A escolher</span>' +
                        '<strong data-luxo-summary-total>R$ 0,00</strong>' +
                    '</div>' +
                    '<button type="button" class="pedido-luxo-add" data-luxo-add>Adicionar ao carrinho</button>' +
                '</div>' +
            '</section>';
        document.body.appendChild(modal);
        modal.addEventListener('click', handleModalClick);
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') closeModal();
        });
        return modal;
    }

    function handleModalClick(event) {
        if (event.target.closest('[data-luxo-close]')) closeModal();
        var mode = event.target.closest('[data-luxo-mode]');
        if (mode) chooseMode(mode.dataset.luxoMode);
        if (event.target.closest('[data-luxo-minus]')) changeAmount(-1);
        if (event.target.closest('[data-luxo-plus]')) changeAmount(1);
        var flavor = event.target.closest('[data-luxo-flavor]');
        if (flavor) toggleFlavor(flavor.dataset.luxoFlavor);
        if (event.target.closest('[data-luxo-add]')) addToCart();
    }

    function openModal(card) {
        active = {
            card: card,
            cfg: getConfig(card),
            mode: '',
            qtd: 10,
            centos: 1,
            sabores: []
        };
        ensureModal();
        modal.querySelector('[data-luxo-config]').hidden = true;
        modal.querySelectorAll('[data-luxo-mode]').forEach(function (btn) {
            btn.classList.remove('is-selected');
        });
        renderFlavors();
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('pedido-luxo-open');
    }

    function closeModal() {
        if (!modal) return;
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('pedido-luxo-open');
    }

    function chooseMode(mode) {
        active.mode = mode;
        active.qtd = mode === 'unitario' ? 10 : 50;
        active.centos = 1;
        active.sabores = flavors(active.card).length > 1 ? [] : flavors(active.card).slice(0, 1);
        modal.querySelector('[data-luxo-config]').hidden = false;
        modal.querySelectorAll('[data-luxo-mode]').forEach(function (btn) {
            btn.classList.toggle('is-selected', btn.dataset.luxoMode === mode);
        });
        update();
    }

    function renderFlavors() {
        var box = modal.querySelector('[data-luxo-flavors-wrap]');
        var grid = modal.querySelector('[data-luxo-flavors]');
        var available = flavors(active.card);
        grid.innerHTML = '';
        if (!available.length) {
            box.hidden = true;
            return;
        }
        box.hidden = false;
        available.forEach(function (name) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'pedido-luxo-flavor';
            btn.dataset.luxoFlavor = name;
            btn.textContent = name;
            grid.appendChild(btn);
        });
    }

    function toggleFlavor(name) {
        var idx = active.sabores.indexOf(name);
        if (idx >= 0) {
            active.sabores.splice(idx, 1);
        } else {
            if (active.sabores.length >= 3) {
                modal.querySelector('[data-luxo-note]').textContent = 'Escolha até 3 sabores.';
                return;
            }
            active.sabores.push(name);
        }
        update();
    }

    function changeAmount(delta) {
        if (active.mode === 'cento') {
            active.centos = Math.max(1, active.centos + delta);
        } else {
            active.qtd = Math.min(49, Math.max(10, active.qtd + delta));
        }
        update();
    }

    function currentTotals() {
        var units = active.mode === 'cento' ? active.centos * active.cfg.unidadesPorCento : active.qtd;
        var total = active.mode === 'cento' ? active.centos * active.cfg.cento : units * active.cfg.unitario;
        return { units: units, total: total };
    }

    function update() {
        var totals = currentTotals();
        modal.querySelector('[data-luxo-qtd]').textContent = active.mode === 'cento' ? active.centos : active.qtd;
        modal.querySelector('[data-luxo-qtd-label]').textContent = active.mode === 'cento'
            ? (active.centos === 1 ? 'cento' : 'centos') + ' / ' + totals.units + ' unidades'
            : 'unidades';
        modal.querySelector('[data-luxo-note]').textContent = active.mode === 'cento'
            ? 'Valor fixo do cento: ' + money(active.cfg.cento) + '.'
            : 'Entre 10 e 49 unidades. Valor unitário: ' + money(active.cfg.unitario) + '.';
        modal.querySelector('[data-luxo-summary-qtd]').textContent = totals.units + ' unidades';
        modal.querySelector('[data-luxo-summary-flavors]').textContent = active.sabores.length ? active.sabores.join(', ') : 'A escolher';
        modal.querySelector('[data-luxo-summary-total]').textContent = money(totals.total);
        modal.querySelectorAll('[data-luxo-flavor]').forEach(function (btn) {
            btn.classList.toggle('is-selected', active.sabores.indexOf(btn.dataset.luxoFlavor) >= 0);
        });
    }

    function addToCart() {
        var available = flavors(active.card);
        if (available.length > 1 && active.sabores.length === 0) {
            modal.querySelector('[data-luxo-note]').textContent = 'Selecione pelo menos um sabor para continuar.';
            return;
        }
        var totals = currentTotals();
        var nome = productName(active.card, active.cfg);
        var sabores = active.sabores.length ? ' — Sabores: ' + active.sabores.join(', ') : '';
        if (active.mode === 'cento') {
            adicionarCarrinho('Pedido por Cento — ' + nome + ' — ' + active.centos + (active.centos === 1 ? ' cento' : ' centos') + ' (' + totals.units + ' unidades)' + sabores, active.cfg.cento, 1, {
                luxo: true,
                quantidade: active.centos
            });
        } else {
            adicionarCarrinho('Pedido por Unidade — ' + nome + ' — ' + active.qtd + ' unidades' + sabores, active.cfg.unitario, 10, {
                luxo: true,
                quantidade: active.qtd
            });
        }
        closeModal();
    }

    function initCard(card) {
        if (card.querySelector('[data-luxo-trigger]')) return;
        card.classList.add('pedido-luxo-card');
        var oldButton = card.querySelector('.dt-btn-carrinho, .dt-centone-btn-carrinho, .btn-adicionar-carrinho');
        if (oldButton) oldButton.classList.add('pedido-luxo-hide');
        var anchor = card.querySelector('.dt-preco-box--inline') || card.querySelector('.des-card-meta') || card;
        var holder = document.createElement('div');
        holder.className = 'pedido-luxo-entry';
        holder.innerHTML =
            '<button type="button" class="pedido-luxo-trigger" data-luxo-trigger>' +
                '<span>Escolher forma do pedido</span>' +
            '</button>';
        anchor.insertAdjacentElement(anchor === card ? 'beforeend' : 'afterend', holder);
        holder.querySelector('[data-luxo-trigger]').addEventListener('click', function () {
            openModal(card);
        });
    }

    function init() {
        ensureModal();
        document.querySelectorAll('article.dt-centone, body.pagina-doces-especiais article.des-card').forEach(initCard);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
