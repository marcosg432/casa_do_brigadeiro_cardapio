/**
 * Bolos Personalizados — configurador premium e integração com orçamento.
 */
(function () {
    if (!document.body.classList.contains('pagina-bolos-personalizados')) return;

    var prices = {
        Chantininho: { PP: 165, P: 265, M: 315, G: 370, GG: 450 },
        Chocolate: { PP: 220, P: 290, M: 385, G: 415, GG: 495 }
    };

    var state = {
        size: 'PP',
        weight: 'Aproximadamente 1,5kg',
        slices: 'até 10 fatias',
        cover: 'Chantininho'
    };

    function money(value) {
        return 'R$ ' + Number(value || 0).toFixed(2).replace('.', ',');
    }

    function currentPrice() {
        return prices[state.cover][state.size] || 0;
    }

    function selectOne(selector, activeEl) {
        document.querySelectorAll(selector).forEach(function (el) {
            var active = el === activeEl;
            el.classList.toggle('is-selected', active);
            el.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
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
        document.getElementById('bp-res-total').textContent = money(currentPrice());
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

        var add = event.target.closest('#bp-add-cart');
        if (add) {
            var nome = 'Bolo Personalizado — Tamanho ' + state.size +
                ' · ' + state.weight +
                ' · Serve ' + state.slices +
                ' · Cobertura ' + state.cover +
                ' · Decorativos cobrados separadamente';

            if (typeof adicionarCarrinho === 'function') {
                adicionarCarrinho(nome, currentPrice(), 1, { luxo: true, quantidade: 1 });
                add.classList.add('is-confirmed');
                window.setTimeout(function () {
                    add.classList.remove('is-confirmed');
                }, 650);
            }
        }
    });

    updateSummary();
})();
