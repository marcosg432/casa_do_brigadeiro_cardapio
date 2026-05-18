/**
 * Seletor de sabores — páginas catálogo centone com article[data-centone-sabores]
 * (Brigadeiros recheados, Brigadeiro Belga). Máx. 3 sabores por cento.
 * Depende de carrinho.js (adicionarCarrinho, lerQtdMinDoCard).
 */
(function () {
    var MAX_SABORES = 3;

    function contarSelecionados(grid) {
        return grid.querySelectorAll('.dt-sabor-pill.dt-sabor-pill--selected').length;
    }

    function atualizarCap(grid, pills, live) {
        var n = contarSelecionados(grid);
        var noCap = n < MAX_SABORES;
        grid.classList.toggle('dt-sabores-grid--cap', !noCap);
        pills.forEach(function (p) {
            var sel = p.classList.contains('dt-sabor-pill--selected');
            p.disabled = !noCap && !sel;
        });
        if (live) {
            if (n >= MAX_SABORES) {
                live.textContent = 'Você pode escolher até 3 sabores.';
                live.classList.add('dt-sabores-live--on', 'dt-sabores-live--cap');
                live.classList.remove('dt-sabores-live--aviso');
            } else {
                live.classList.remove('dt-sabores-live--cap', 'dt-sabores-live--aviso');
                live.textContent = '';
                live.classList.remove('dt-sabores-live--on');
            }
        }
    }

    function mostrarAvisoCarrinho(live, texto) {
        if (!live) return;
        live.textContent = texto;
        live.classList.add('dt-sabores-live--on', 'dt-sabores-live--aviso');
        live.classList.remove('dt-sabores-live--cap');
    }

    function initCentoneSabores() {
        var card = document.querySelector('article.dt-centone[data-centone-sabores]');
        if (!card) return;

        var grid = card.querySelector('.dt-sabores-grid');
        var live = card.querySelector('.dt-sabores-live');
        var btn = card.querySelector('.dt-centone-btn-carrinho');
        if (!grid) return;

        var pills = grid.querySelectorAll('.dt-sabor-pill');

        pills.forEach(function (p) {
            p.addEventListener('click', function () {
                if (live && live.classList.contains('dt-sabores-live--aviso')) {
                    live.textContent = '';
                    live.classList.remove('dt-sabores-live--on', 'dt-sabores-live--aviso');
                }
                var sel = p.classList.contains('dt-sabor-pill--selected');
                if (sel) {
                    p.classList.remove('dt-sabor-pill--selected');
                    p.setAttribute('aria-pressed', 'false');
                    atualizarCap(grid, pills, live);
                    return;
                }
                if (contarSelecionados(grid) >= MAX_SABORES) {
                    if (live) {
                        live.textContent = 'Você pode escolher até 3 sabores.';
                        live.classList.add('dt-sabores-live--on', 'dt-sabores-live--cap');
                        live.classList.remove('dt-sabores-live--aviso');
                    }
                    return;
                }
                p.classList.add('dt-sabor-pill--selected');
                p.setAttribute('aria-pressed', 'true');
                atualizarCap(grid, pills, live);
            });
        });

        if (btn) {
            btn.addEventListener('click', function () {
                var selecionados = [];
                grid.querySelectorAll('.dt-sabor-pill.dt-sabor-pill--selected').forEach(function (p) {
                    if (p.dataset.sabor) selecionados.push(p.dataset.sabor);
                });
                if (selecionados.length === 0) {
                    mostrarAvisoCarrinho(live, 'Selecione pelo menos um sabor para o seu cento.');
                    return;
                }
                var nomeBase = card.dataset.produtoNome || card.getAttribute('data-produto-nome') || '';
                var preco = parseFloat(card.dataset.produtoPreco || card.getAttribute('data-produto-preco') || '0') || 0;
                var qtdMin =
                    typeof lerQtdMinDoCard === 'function'
                        ? lerQtdMinDoCard(card)
                        : parseInt(String(card.dataset.produtoQtdMin || card.getAttribute('data-produto-qtd-min') || '100'), 10) || 100;
                var nome = nomeBase + ' — Sabores: ' + selecionados.join(', ');
                if (typeof adicionarCarrinho === 'function') {
                    adicionarCarrinho(nome, preco, qtdMin);
                }
            });
        }

        atualizarCap(grid, pills, live);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCentoneSabores);
    } else {
        initCentoneSabores();
    }
})();
