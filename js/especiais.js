/**
 * Especial — quantidades e carrinho com personalização (itens luxo).
 */
(function () {
    var MAX_QTY = 99;

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

    document.addEventListener('click', function (e) {
        if (!document.body.classList.contains('pagina-especial')) return;
        var btn = e.target.closest('.esp-qty-btn');
        if (!btn) return;
        var wrap = btn.closest('.esp-qty');
        if (!wrap) return;
        var valEl = wrap.querySelector('[data-des-qty-val]');
        if (!valEl) return;
        var n = parseQty(valEl);
        if (btn.classList.contains('esp-qty-btn--minus')) {
            n = Math.max(1, n - 1);
        } else if (btn.classList.contains('esp-qty-btn--plus')) {
            n = Math.min(MAX_QTY, n + 1);
        } else {
            return;
        }
        setQty(valEl, n);
        syncMinus(wrap, n);
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
        e.preventDefault();

        var nomeBase = card.getAttribute('data-produto-nome') || card.dataset.produtoNome || '';
        var preco = parseFloat(card.dataset.produtoPreco || card.getAttribute('data-produto-preco') || '0') || 0;
        var qtdMin = Math.max(1, parseInt(String(card.dataset.produtoQtdMin || card.getAttribute('data-produto-qtd-min') || '1'), 10) || 1);
        var wrap = card.querySelector('.esp-qty');
        var qEl = wrap && wrap.querySelector('[data-des-qty-val]');
        var qtd = Math.max(1, parseInt(String(qEl && qEl.textContent ? qEl.textContent : '1'), 10) || 1);

        var extra = coletarPersonalizacao();
        var nome = nomeBase + (extra ? ' — ' + extra : '');

        if (typeof adicionarCarrinho === 'function') {
            adicionarCarrinho(nome, preco, qtdMin, { luxo: true, quantidade: qtd });
        }
    });

    function initQty() {
        document.querySelectorAll('.pagina-especial .esp-qty').forEach(function (wrap) {
            var valEl = wrap.querySelector('[data-des-qty-val]');
            if (!valEl) return;
            if (!valEl.hasAttribute('aria-valuenow')) {
                valEl.setAttribute('aria-valuenow', String(parseQty(valEl)));
            }
            syncMinus(wrap, parseQty(valEl));
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initQty);
    } else {
        initQty();
    }
})();
