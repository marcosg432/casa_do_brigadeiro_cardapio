/**
 * Bolos Personalizados — configurador premium e integração com orçamento.
 */
(function () {
    if (!document.body.classList.contains('pagina-bolos-personalizados')) return;

    var prices = {
        Chantininho: { PP: 165, P: 265, M: 315, G: 370, GG: 450 },
        Chocolate: { PP: 220, P: 290, M: 385, G: 415, GG: 495 }
    };

    var extrasCatalog = {
        topo: { label: 'Topo de bolo', price: 25 },
        'flores-naturais': { label: 'Flores naturais', price: null },
        'flores-artificiais': { label: 'Flores artificiais', price: null },
        'decoracao-personalizada': { label: 'Decoração personalizada', price: null }
    };

    var state = {
        size: 'PP',
        weight: 'Aproximadamente 1,5kg',
        slices: 'até 10 fatias',
        cover: 'Chantininho',
        extras: []
    };

    function money(value) {
        return 'R$ ' + Number(value || 0).toFixed(2).replace('.', ',');
    }

    function currentBasePrice() {
        return prices[state.cover][state.size] || 0;
    }

    function extrasTotal() {
        return state.extras.reduce(function (sum, id) {
            var item = extrasCatalog[id];
            return sum + (item && item.price ? item.price : 0);
        }, 0);
    }

    function currentPrice() {
        return currentBasePrice() + extrasTotal();
    }

    function selectOne(selector, activeEl) {
        document.querySelectorAll(selector).forEach(function (el) {
            var active = el === activeEl;
            el.classList.toggle('is-selected', active);
            el.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
    }

    function updateExtraCards() {
        document.querySelectorAll('.bp-extra-card').forEach(function (card) {
            var id = card.getAttribute('data-bp-extra');
            var active = state.extras.indexOf(id) >= 0;
            card.classList.toggle('is-selected', active);
            card.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
    }

    function extrasSummaryText() {
        if (!state.extras.length) return 'Nenhum opcional';
        return state.extras.map(function (id) {
            return extrasCatalog[id].label;
        }).join(' · ');
    }

    function extrasNoteText() {
        var total = extrasTotal();
        if (!total) return '';
        return '+' + money(total) + ' em decorativos';
    }

    function updateCoverPrices() {
        var chantininho = document.getElementById('bp-price-chantininho');
        var chocolate = document.getElementById('bp-price-chocolate');
        if (chantininho) chantininho.textContent = money(prices.Chantininho[state.size]);
        if (chocolate) chocolate.textContent = money(prices.Chocolate[state.size]);
    }

    function updateSummary() {
        updateCoverPrices();
        document.getElementById('bp-res-size').textContent = state.size;
        document.getElementById('bp-res-slices').textContent = state.slices;
        document.getElementById('bp-res-cover').textContent = state.cover;

        var extrasEl = document.getElementById('bp-res-extras');
        if (extrasEl) extrasEl.textContent = extrasSummaryText();

        var extrasNote = document.getElementById('bp-res-extras-note');
        if (extrasNote) {
            var note = extrasNoteText();
            extrasNote.textContent = note;
            extrasNote.classList.toggle('hidden', !note);
        }

        document.getElementById('bp-res-total').textContent = money(currentPrice());
    }

    function toggleExtra(card) {
        var id = card.getAttribute('data-bp-extra');
        if (!id || !extrasCatalog[id]) return;

        var idx = state.extras.indexOf(id);
        if (idx >= 0) state.extras.splice(idx, 1);
        else state.extras.push(id);

        updateExtraCards();
        updateSummary();
    }

    document.addEventListener('click', function (event) {
        var size = event.target.closest('[data-bp-size]');
        if (size) {
            state.size = size.getAttribute('data-bp-size');
            state.weight = size.getAttribute('data-bp-weight');
            state.slices = size.getAttribute('data-bp-slices');
            selectOne('.bp-size-card', size);
            updateSummary();
            return;
        }

        var cover = event.target.closest('[data-bp-cover]');
        if (cover) {
            state.cover = cover.getAttribute('data-bp-cover');
            selectOne('.bp-cover-card', cover);
            updateSummary();
            return;
        }

        var extra = event.target.closest('[data-bp-extra]');
        if (extra) {
            toggleExtra(extra);
            return;
        }

        var add = event.target.closest('#bp-add-cart');
        if (add) {
            var nome = 'Bolo Personalizado — Tamanho ' + state.size +
                ' · ' + state.weight +
                ' · Serve ' + state.slices +
                ' · Cobertura ' + state.cover;

            if (state.extras.length) {
                nome += ' · Decorativos: ' + state.extras.map(function (id) {
                    var item = extrasCatalog[id];
                    if (item.price) return item.label + ' (+' + money(item.price) + ')';
                    return item.label + ' (sob consulta)';
                }).join(', ');
            }

            if (typeof adicionarCarrinho === 'function') {
                adicionarCarrinho(nome, currentPrice(), 1, { luxo: true, quantidade: 1 });
                add.classList.add('is-confirmed');
                window.setTimeout(function () {
                    add.classList.remove('is-confirmed');
                }, 650);
            }
        }
    });

    updateExtraCards();
    updateSummary();
})();
