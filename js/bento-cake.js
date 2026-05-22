/**
 * Bentô Cake — configurador divertido premium e integração com orçamento.
 */
(function () {
    if (!document.body.classList.contains('pagina-bento-cake')) return;

    var prices = {
        PP: { tradicional: 65, especial: null },
        P: { tradicional: 120, especial: 140 },
        M: { tradicional: 160, especial: 180 },
        G: { tradicional: 200, especial: 220 }
    };

    var state = {
        size: 'PP',
        slices: 'até 4 fatias',
        weight: '400g',
        diameter: '10cm',
        variant: 'tradicional',
        style: 'Engraçado',
        phrase: '',
        name: '',
        note: ''
    };

    function money(value) {
        return 'R$ ' + Number(value || 0).toFixed(2).replace('.', ',');
    }

    function currentPrice() {
        return prices[state.size][state.variant] || prices[state.size].tradicional;
    }

    function selectOne(selector, activeEl) {
        document.querySelectorAll(selector).forEach(function (el) {
            var active = el === activeEl;
            el.classList.toggle('is-selected', active);
            el.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
    }

    function syncVariantAvailability() {
        var special = document.querySelector('[data-bt-variant="especial"]');
        if (!special) return;
        var disabled = state.size === 'PP';
        special.classList.toggle('is-disabled', disabled);
        special.setAttribute('aria-disabled', disabled ? 'true' : 'false');
        if (disabled && state.variant === 'especial') {
            state.variant = 'tradicional';
            var traditional = document.querySelector('[data-bt-variant="tradicional"]');
            if (traditional) selectOne('.bt-variant-card', traditional);
        }
    }

    function updateSummary() {
        syncVariantAvailability();
        document.getElementById('bt-res-size').textContent = state.size + ' · ' + state.diameter + ' · ' + state.weight;
        document.getElementById('bt-res-slices').textContent = state.slices;
        document.getElementById('bt-res-style').textContent = state.style;
        document.getElementById('bt-res-phrase').textContent = state.phrase || 'A definir';
        document.getElementById('bt-res-variant').textContent = state.variant === 'especial' ? 'Especial' : 'Tradicional';
        document.getElementById('bt-res-total').textContent = money(currentPrice());
    }

    function fieldValue(id) {
        var el = document.getElementById(id);
        return el && el.value ? String(el.value).trim() : '';
    }

    document.addEventListener('click', function (event) {
        var size = event.target.closest('[data-bt-size]');
        if (size) {
            state.size = size.getAttribute('data-bt-size');
            state.slices = size.getAttribute('data-bt-slices');
            state.weight = size.getAttribute('data-bt-weight');
            state.diameter = size.getAttribute('data-bt-diameter');
            selectOne('.bt-size-card', size);
            updateSummary();
            return;
        }

        var variant = event.target.closest('[data-bt-variant]');
        if (variant) {
            if (variant.getAttribute('aria-disabled') === 'true') return;
            state.variant = variant.getAttribute('data-bt-variant');
            selectOne('.bt-variant-card', variant);
            updateSummary();
            return;
        }

        var style = event.target.closest('[data-bt-style]');
        if (style) {
            state.style = style.getAttribute('data-bt-style');
            selectOne('.bt-style-pill', style);
            updateSummary();
            return;
        }

        var add = event.target.closest('#bt-add-cart');
        if (add) {
            state.phrase = fieldValue('bt-phrase');
            state.name = fieldValue('bt-name');
            state.note = fieldValue('bt-note');
            updateSummary();

            var nome = 'Bentô Cake — Tamanho ' + state.size +
                ' · ' + state.diameter +
                ' · ' + state.weight +
                ' · ' + state.slices +
                ' · ' + (state.variant === 'especial' ? 'Especial' : 'Tradicional') +
                ' · Estilo ' + state.style +
                (state.phrase ? ' · Frase: "' + state.phrase + '"' : '') +
                (state.name ? ' · Nome: ' + state.name : '') +
                (state.note ? ' · Obs: ' + state.note : '');

            if (typeof adicionarCarrinho === 'function') {
                adicionarCarrinho(nome, currentPrice(), 1, { luxo: true, quantidade: 1 });
                add.classList.add('is-confirmed');
                window.setTimeout(function () {
                    add.classList.remove('is-confirmed');
                }, 650);
            }
        }
    });

    ['bt-phrase', 'bt-name', 'bt-note'].forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('input', function () {
            state.phrase = fieldValue('bt-phrase');
            state.name = fieldValue('bt-name');
            state.note = fieldValue('bt-note');
            updateSummary();
        });
    });

    updateSummary();
})();
