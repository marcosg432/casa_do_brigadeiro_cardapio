/**
 * Normalização de orçamentos (campos novos x legados, status)
 */
function statusNormalizado(o) {
    var s = o && o.status;
    if (!s) return "novo_orcamento";
    if (typeof CONFIG !== "undefined" && CONFIG.STATUS_LABELS && CONFIG.STATUS_LABELS[s]) {
        return s;
    }
    if (typeof CONFIG !== "undefined" && CONFIG.STATUS_LABELS) {
        var keys = Object.keys(CONFIG.STATUS_LABELS);
        for (var i = 0; i < keys.length; i++) {
            if (CONFIG.STATUS_LABELS[keys[i]] === s) return keys[i];
        }
    }
    return "novo_orcamento";
}

function eventoDataOrc(o) {
    if (!o) return "";
    return o.evento_data || o.data_evento || (o.data ? String(o.data).slice(0, 10) : "");
}

function eventoTipoOrc(o) {
    if (!o) return "";
    return o.evento_tipo || o.tipo_evento || "";
}

function localOrc(o) {
    if (!o) return "";
    return o.local || o.local_evento || "";
}

function formaPagamentoOrc(o) {
    if (!o) return "";
    return o.forma_pagamento != null && o.forma_pagamento !== "" ? o.forma_pagamento : (o.forma_pagamento_ref || o.pagamento || "");
}

function valorFinalOrc(o) {
    if (!o) return 0;
    var v = o.valor_final;
    if (v == null) v = o.total;
    return Number(v) || 0;
}

function valorOriginalOrcCompat(o) {
    if (!o) return 0;
    var v = o.valor_original;
    if (v == null) v = o.total;
    return Number(v) || 0;
}

function classeCssStatus(key) {
    return "status-" + String(key).replace(/[^a-z0-9_]/gi, "_");
}
