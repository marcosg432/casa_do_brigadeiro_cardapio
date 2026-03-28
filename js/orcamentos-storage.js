/**
 * Persistência de orçamentos no localStorage
 * Chave fixa: "orcamentos" (array JSON)
 */

var ORCAMENTOS_LS_KEY = "orcamentos";

function getLegacyOrcamentosKey() {
    var nome = (typeof CONFIG !== "undefined" && CONFIG.nomeEmpresa)
        ? CONFIG.nomeEmpresa.replace(/\s+/g, "_").toLowerCase()
        : "default";
    return "orcamentos_" + nome;
}

function listarOrcamentos() {
    try {
        var raw = localStorage.getItem(ORCAMENTOS_LS_KEY);
        var arr = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(arr)) arr = [];

        if (arr.length === 0) {
            var legado = localStorage.getItem(getLegacyOrcamentosKey());
            if (legado) {
                var oldArr = JSON.parse(legado);
                if (Array.isArray(oldArr) && oldArr.length > 0) {
                    arr = oldArr;
                    localStorage.setItem(ORCAMENTOS_LS_KEY, JSON.stringify(arr));
                }
            }
        }
        return arr;
    } catch (e) {
        console.warn("Erro ao listar orçamentos:", e);
        return [];
    }
}

function salvarListaOrcamentos(arr) {
    try {
        localStorage.setItem(ORCAMENTOS_LS_KEY, JSON.stringify(arr));
    } catch (e) {
        console.warn("LocalStorage:", e);
        throw e;
    }
}

function getOrcamentoPorId(id) {
    return listarOrcamentos().find(function (o) {
        return String(o.id) === String(id);
    });
}

function criarOrcamento(registro) {
    var list = listarOrcamentos();
    list.unshift(registro);
    salvarListaOrcamentos(list);
    return registro;
}

function atualizarOrcamentoParcial(id, patch) {
    var list = listarOrcamentos();
    var i = list.findIndex(function (o) {
        return String(o.id) === String(id);
    });
    if (i === -1) return null;
    list[i] = Object.assign({}, list[i], patch);
    salvarListaOrcamentos(list);
    return list[i];
}
