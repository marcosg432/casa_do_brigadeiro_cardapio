/**
 * Especial / Bolos Diversos — quantidades, peso por kg e carrinho.
 */
(function () {
    var MAX_QTY = 99;
    var MAX_BOLO_QTY = 20;

    function parseQty(el) {
        var n = parseInt(String(el.textContent || '1'), 10);
        return Number.isFinite(n) && n >= 1 ? n : 1;
    }

    function setQty(valEl, n) {
        valEl.textContent = String(n);
        valEl.setAttribute('aria-valuenow', String(n));
    }

    function syncMinus(wrap, n) {
        var minus = wrap.querySelector('.esp-qty-btn--minus');
        if (minus) minus.disabled = n <= 1;
    }

    function money(v) {
        var n = Number(v || 0);
        var parts = n.toFixed(2).split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return 'R$\u00a0' + parts.join(',');
    }

    function weightLabel(v) {
        return String(v).replace('.', ',') + 'kg';
    }

    function getSelectedWeight(panel) {
        var btn = panel.querySelector('.esp-weight.is-selected');
        return parseFloat(btn && btn.getAttribute('data-esp-weight')) || 1;
    }

    function selectWeight(panel, activeBtn) {
        panel.querySelectorAll('.esp-weight').forEach(function (el) {
            var active = el === activeBtn;
            el.classList.toggle('is-selected', active);
            el.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
    }

    function updateKgTotal(card) {
        var panel = card.querySelector('[data-esp-kg-panel]');
        if (!panel) return;
        var priceKg = parseFloat(card.getAttribute('data-produto-preco') || card.dataset.produtoPreco || '0') || 0;
        var weight = getSelectedWeight(panel);
        var qEl = panel.querySelector('[data-esp-bolo-qty]');
        var qtd = qEl ? parseQty(qEl) : 1;
        var lineTotal = priceKg * weight * qtd;
        var strong = panel.querySelector('[data-esp-kg-total] strong');
        if (strong) strong.textContent = money(lineTotal);
    }

    document.addEventListener('click', function (e) {
        if (!document.body.classList.contains('pagina-especial')) return;

        var weightBtn = e.target.closest('.esp-weight');
        if (weightBtn) {
            var panel = weightBtn.closest('[data-esp-kg-panel]');
            if (!panel) return;
            selectWeight(panel, weightBtn);
            var card = weightBtn.closest('[data-produto-nome]');
            if (card) updateKgTotal(card);
            return;
        }

        var btn = e.target.closest('.esp-qty-btn');
        if (!btn) return;
        var wrap = btn.closest('.esp-qty');
        if (!wrap) return;

        var valKg = wrap.querySelector('[data-esp-bolo-qty]');
        var valDes = wrap.querySelector('[data-des-qty-val]');
        var valEl = valKg || valDes;
        if (!valEl) return;

        var max = valKg ? MAX_BOLO_QTY : MAX_QTY;
        var n = parseQty(valEl);
        if (btn.classList.contains('esp-qty-btn--minus')) {
            n = Math.max(1, n - 1);
        } else if (btn.classList.contains('esp-qty-btn--plus')) {
            n = Math.min(max, n + 1);
        } else {
            return;
        }
        setQty(valEl, n);
        syncMinus(wrap, n);

        if (valKg) {
            var cardKg = btn.closest('[data-produto-nome]');
            if (cardKg) updateKgTotal(cardKg);
        }
    });

    function coletarPersonalizacao() {
        var partes = [];
        function add(rotulo, id) {
            var el = document.getElementById(id);
            if (!el) return;
            var t = String(el.value || '').trim();
            if (t) partes.push(rotulo + ': ' + t);
        }
        add('Tema', 'esp-pers-tema');
        add('Nome', 'esp-pers-nome');
        add('Detalhes', 'esp-pers-detalhes');
        add('Observações', 'esp-pers-obs');
        if (!partes.length) return '';
        var s = partes.join(' · ');
        if (s.length > 220) s = s.slice(0, 217) + '…';
        return s;
    }

    document.addEventListener('click', function (e) {
        if (!document.body.classList.contains('pagina-especial')) return;
        var btn = e.target.closest('.esp-btn-add');
        if (!btn) return;
        var card = btn.closest('[data-produto-nome]');
        if (!card) return;
        if (card.hasAttribute('data-preco-cento')) return;
        e.preventDefault();

        var nomeBase = card.getAttribute('data-produto-nome') || card.dataset.produtoNome || '';
        var qtdMin = Math.max(1, parseInt(String(card.dataset.produtoQtdMin || card.getAttribute('data-produto-qtd-min') || '1'), 10) || 1);
        var extra = coletarPersonalizacao();
        var panel = card.querySelector('[data-esp-kg-panel]');

        if (panel) {
            var priceKg = parseFloat(card.getAttribute('data-produto-preco') || card.dataset.produtoPreco || '0') || 0;
            var weight = getSelectedWeight(panel);
            var qEl = panel.querySelector('[data-esp-bolo-qty]');
            var qtd = Math.max(1, parseInt(String(qEl && qEl.textContent ? qEl.textContent : '1'), 10) || 1);
            var total = priceKg * weight;
            var nome = nomeBase + ' · ' + weightLabel(weight) + (extra ? ' — ' + extra : '');

            if (typeof adicionarCarrinho === 'function') {
                adicionarCarrinho(nome, total, 1, { luxo: true, quantidade: qtd });
            }
            return;
        }

        var preco = parseFloat(card.dataset.produtoPreco || card.getAttribute('data-produto-preco') || '0') || 0;
        var wrap = card.querySelector('.esp-qty');
        var qElDes = wrap && wrap.querySelector('[data-des-qty-val]');
        var qtd = Math.max(1, parseInt(String(qElDes && qElDes.textContent ? qElDes.textContent : '1'), 10) || 1);
        var nome = nomeBase + (extra ? ' — ' + extra : '');

        if (typeof adicionarCarrinho === 'function') {
            adicionarCarrinho(nome, preco, qtdMin, { luxo: true, quantidade: qtd });
        }
    });

    function initQty() {
        document.querySelectorAll('.pagina-especial .esp-qty').forEach(function (wrap) {
            var valEl = wrap.querySelector('[data-esp-bolo-qty], [data-des-qty-val]');
            if (!valEl) return;
            if (!valEl.hasAttribute('aria-valuenow')) {
                valEl.setAttribute('aria-valuenow', String(parseQty(valEl)));
            }
            syncMinus(wrap, parseQty(valEl));
        });

        document.querySelectorAll('.pagina-especial .esp-showpiece--por-kg').forEach(function (card) {
            updateKgTotal(card);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initQty);
    } else {
        initQty();
    }
})();
