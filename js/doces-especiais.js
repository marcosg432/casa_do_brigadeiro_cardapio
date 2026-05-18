/**
 * Doces especiais — contador de quantidade premium (+ / −).
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

    function syncMinusState(wrap, n) {
        var minus = wrap.querySelector('.des-qty-btn--minus');
        if (minus) minus.disabled = n <= 1;
    }

    document.addEventListener('click', function (e) {
        var btn = e.target.closest('.des-qty-btn');
        if (!btn || !document.body.classList.contains('pagina-doces-especiais')) return;
        var wrap = btn.closest('.des-qty');
        if (!wrap) return;
        var valEl = wrap.querySelector('[data-des-qty-val]');
        if (!valEl) return;
        var n = parseQty(valEl);
        if (btn.classList.contains('des-qty-btn--minus')) {
            n = Math.max(1, n - 1);
        } else if (btn.classList.contains('des-qty-btn--plus')) {
            n = Math.min(MAX_QTY, n + 1);
        } else {
            return;
        }
        setQty(valEl, n);
        syncMinusState(wrap, n);
    });

    function initWraps() {
        document.querySelectorAll('.pagina-doces-especiais .des-qty').forEach(function (wrap) {
            var valEl = wrap.querySelector('[data-des-qty-val]');
            if (!valEl) return;
            if (!valEl.hasAttribute('aria-valuenow')) {
                valEl.setAttribute('aria-valuenow', String(parseQty(valEl)));
            }
            syncMinusState(wrap, parseQty(valEl));
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWraps);
    } else {
        initWraps();
    }
})();
