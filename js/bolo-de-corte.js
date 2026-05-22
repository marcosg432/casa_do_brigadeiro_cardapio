/**
 * Bolo de Corte — montagem guiada e integração com orçamento.
 */
(function () {
    if (!document.body.classList.contains('pagina-bolo-corte')) return;

    var state = {
        cover: 'Cobertura de Chantininho',
        priceKg: 89.9,
        flavor: 'Brigadeiro Belga',
        dough: 'Baunilha',
        weight: 1,
        qty: 1
    };

    function money(v) {
        return 'R$ ' + Number(v || 0).toFixed(2).replace('.', ',');
    }

    function weightLabel(v) {
        return String(v).replace('.', ',') + 'kg';
    }

    function selectOne(selector, activeEl) {
        document.querySelectorAll(selector).forEach(function (el) {
            var active = el === activeEl;
            el.classList.toggle('is-selected', active);
            el.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
    }

    function updateSummary() {
        var total = state.priceKg * state.weight * state.qty;
        document.getElementById('bc-res-cover').textContent = state.cover;
        document.getElementById('bc-res-flavor').textContent = state.flavor;
        document.getElementById('bc-res-dough').textContent = state.dough;
        document.getElementById('bc-res-weight').textContent = weightLabel(state.weight);
        document.getElementById('bc-res-qty').textContent = state.qty + (state.qty === 1 ? ' bolo' : ' bolos');
        document.getElementById('bc-res-total').textContent = money(total);
        document.getElementById('bc-qty-value').textContent = String(state.qty);
    }

    function setFlavorByName(name) {
        var btn = Array.prototype.find.call(document.querySelectorAll('[data-bc-flavor]'), function (el) {
            return el.getAttribute('data-bc-flavor') === name;
        });
        if (!btn) return;
        state.flavor = name;
        selectOne('.bc-pill', btn);
    }

    function setDoughByName(name) {
        var btn = Array.prototype.find.call(document.querySelectorAll('[data-bc-dough]'), function (el) {
            return el.getAttribute('data-bc-dough') === name;
        });
        if (!btn) return;
        state.dough = name;
        selectOne('.bc-dough-card', btn);
    }

    function highlightCombo(combo) {
        document.querySelectorAll('.bc-combo').forEach(function (el) {
            el.classList.toggle('is-selected', el === combo);
        });
    }

    document.addEventListener('click', function (event) {
        var cover = event.target.closest('[data-bc-cover]');
        if (cover) {
            state.cover = cover.getAttribute('data-bc-cover');
            state.priceKg = parseFloat(cover.getAttribute('data-bc-price')) || state.priceKg;
            selectOne('.bc-cover-card', cover);
            updateSummary();
            return;
        }

        var flavor = event.target.closest('[data-bc-flavor]');
        if (flavor) {
            state.flavor = flavor.getAttribute('data-bc-flavor');
            selectOne('.bc-pill', flavor);
            highlightCombo(null);
            updateSummary();
            return;
        }

        var dough = event.target.closest('[data-bc-dough]');
        if (dough) {
            state.dough = dough.getAttribute('data-bc-dough');
            selectOne('.bc-dough-card', dough);
            highlightCombo(null);
            updateSummary();
            return;
        }

        var weight = event.target.closest('[data-bc-weight]');
        if (weight) {
            state.weight = parseFloat(weight.getAttribute('data-bc-weight')) || 1;
            selectOne('.bc-weight', weight);
            updateSummary();
            return;
        }

        var qty = event.target.closest('[data-bc-qty]');
        if (qty) {
            if (qty.getAttribute('data-bc-qty') === 'minus') {
                state.qty = Math.max(1, state.qty - 1);
            } else {
                state.qty = Math.min(20, state.qty + 1);
            }
            updateSummary();
            return;
        }

        var combo = event.target.closest('[data-bc-combo-flavor]');
        if (combo) {
            setFlavorByName(combo.getAttribute('data-bc-combo-flavor'));
            setDoughByName(combo.getAttribute('data-bc-combo-dough'));
            highlightCombo(combo);
            updateSummary();
            var summary = document.querySelector('.bc-summary');
            if (summary && summary.scrollIntoView && window.innerWidth < 900) {
                summary.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
            return;
        }

        var add = event.target.closest('#bc-add-cart');
        if (add) {
            var total = state.priceKg * state.weight;
            var nome = 'Bolo de Corte — ' +
                state.cover + ' · ' +
                state.flavor + ' · Massa ' +
                state.dough + ' · ' +
                weightLabel(state.weight);

            if (typeof adicionarCarrinho === 'function') {
                adicionarCarrinho(nome, total, 1, { luxo: true, quantidade: state.qty });
                add.classList.add('is-confirmed');
                window.setTimeout(function () {
                    add.classList.remove('is-confirmed');
                }, 650);
            }
        }
    });

    updateSummary();
})();
