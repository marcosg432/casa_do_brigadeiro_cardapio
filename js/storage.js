/**
 * storage.js - Persistência do carrinho no localStorage
 * Sistema de pedidos reutilizável para cardápios digitais
 */

/**
 * Retorna a chave única do localStorage para o carrinho
 * @returns {string}
 */
function getStorageKey() {
    const nome = (typeof CONFIG !== 'undefined' && CONFIG.nomeEmpresa)
        ? CONFIG.nomeEmpresa.replace(/\s+/g, '_').toLowerCase()
        : 'carrinho';
    return 'carrinho_' + nome;
}

/**
 * Salva os dados do carrinho no localStorage
 * @param {Array} dados - Array de itens do carrinho
 */
function salvarCarrinho(dados) {
    try {
        localStorage.setItem(getStorageKey(), JSON.stringify(dados));
    } catch (e) {
        console.warn('LocalStorage indisponível:', e);
    }
}

/**
 * Carrega o carrinho do localStorage
 * @returns {Array} Array de itens ou array vazio
 */
function carregarCarrinho() {
    try {
        const saved = localStorage.getItem(getStorageKey());
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.warn('Erro ao carregar carrinho:', e);
    }
    return [];
}
