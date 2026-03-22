/**
 * carrinho.js - Lógica do carrinho de compras
 * Sistema de pedidos reutilizável para cardápios digitais
 */

/** Array do carrinho: { nome, preco, quantidade } */
let carrinho = [];

/**
 * Adiciona produto ao carrinho ou aumenta quantidade se já existir
 * @param {string} nome - Nome do produto
 * @param {number} preco - Preço unitário
 */
function adicionarCarrinho(nome, preco) {
    const precoNum = typeof preco === 'number' ? preco : parseFloat(String(preco).replace(',', '.')) || 0;
    const itemExistente = carrinho.find(item => item.nome === nome && item.preco === precoNum);

    if (itemExistente) {
        itemExistente.quantidade += 1;
    } else {
        carrinho.push({ nome, preco: precoNum, quantidade: 1 });
    }

    salvarCarrinho(carrinho);
    atualizarCarrinho();
    atualizarBadge();
    abrirCarrinho();
}

/**
 * Remove item do carrinho pelo índice
 * @param {number} index - Índice do item
 */
function removerItem(index) {
    carrinho.splice(index, 1);
    salvarCarrinho(carrinho);
    atualizarCarrinho();
    atualizarBadge();
}

/**
 * Altera quantidade de um item
 * @param {number} index - Índice do item
 * @param {string} acao - "aumentar" ou "diminuir"
 */
function alterarQuantidade(index, acao) {
    const item = carrinho[index];
    if (!item) return;

    const delta = acao === 'aumentar' ? 1 : (acao === 'diminuir' ? -1 : 0);
    item.quantidade += delta;

    if (item.quantidade <= 0) {
        removerItem(index);
    } else {
        salvarCarrinho(carrinho);
        atualizarCarrinho();
        atualizarBadge();
    }
}

/**
 * Atualiza a interface do carrinho (lista e total)
 */
function atualizarCarrinho() {
    const listaEl = document.getElementById('lista-carrinho');
    const totalEl = document.getElementById('total');
    const btnFinalizar = document.querySelector('.btn-finalizar-pedido');

    if (!listaEl) return;

    listaEl.innerHTML = '';

    if (carrinho.length === 0) {
        if (totalEl) totalEl.textContent = 'R$ 0,00';
        if (btnFinalizar) btnFinalizar.disabled = true;
        return;
    }

    carrinho.forEach((item, index) => {
        const subtotal = item.preco * item.quantidade;
        const li = document.createElement('li');
        li.className = 'carrinho-item';
        li.innerHTML = `
            <div class="carrinho-item-info">
                <div class="carrinho-item-nome">${escapeHtml(item.nome)}</div>
                <div class="carrinho-item-preco-unit">R$ ${formatarPreco(item.preco)} un.</div>
            </div>
            <div class="carrinho-item-controles">
                <div class="carrinho-item-qty">
                    <button type="button" aria-label="Diminuir" onclick="alterarQuantidade(${index}, 'diminuir')">−</button>
                    <span>${item.quantidade}</span>
                    <button type="button" aria-label="Aumentar" onclick="alterarQuantidade(${index}, 'aumentar')">+</button>
                </div>
                <button type="button" class="carrinho-item-remove" onclick="removerItem(${index})">Remover</button>
            </div>
            <span class="carrinho-item-subtotal">R$ ${formatarPreco(subtotal)}</span>
        `;
        listaEl.appendChild(li);
    });

    const total = calcularTotal();
    if (totalEl) totalEl.textContent = 'R$ ' + formatarPreco(total);
    if (btnFinalizar) btnFinalizar.disabled = false;
}

/**
 * Calcula o valor total do carrinho
 * @returns {number}
 */
function calcularTotal() {
    return carrinho.reduce((acc, item) => acc + item.preco * item.quantidade, 0);
}

/**
 * Formata preço para exibição
 * @param {number} valor
 * @returns {string}
 */
function formatarPreco(valor) {
    return Number(valor).toFixed(2).replace('.', ',');
}

/**
 * Escapa HTML para evitar XSS
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Atualiza badge com quantidade de itens
 */
function atualizarBadge() {
    const badge = document.querySelector('.carrinho-badge');
    if (!badge) return;

    const qty = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
    badge.textContent = qty;
    badge.style.display = qty > 0 ? 'flex' : 'none';
}

/**
 * Abre o sidebar do carrinho
 */
function abrirCarrinho() {
    document.querySelector('.carrinho-overlay')?.classList.add('ativo');
    document.querySelector('.carrinho-sidebar')?.classList.add('ativo');
    document.body.style.overflow = 'hidden';
}

/**
 * Fecha o sidebar do carrinho
 */
function fecharCarrinho() {
    document.querySelector('.carrinho-overlay')?.classList.remove('ativo');
    document.querySelector('.carrinho-sidebar')?.classList.remove('ativo');
    document.body.style.overflow = '';
}

/**
 * Extrai preço numérico de texto como "R$ 45,00" ou "A partir de R$ 45,00"
 * @param {string} texto
 * @returns {number}
 */
function extrairPreco(texto) {
    if (!texto) return 0;
    const match = texto.match(/R\$\s*([\d.,]+)/);
    if (!match) return 0;
    return parseFloat(match[1].replace('.', '').replace(',', '.')) || 0;
}

/**
 * Inicializa o carrinho: carrega dados e vincula eventos
 */
function initCarrinho() {
    carrinho = carregarCarrinho();

    document.querySelector('.carrinho-toggle')?.addEventListener('click', abrirCarrinho);
    document.querySelector('.carrinho-close')?.addEventListener('click', fecharCarrinho);
    document.querySelector('.carrinho-overlay')?.addEventListener('click', fecharCarrinho);

    document.querySelectorAll('.btn-adicionar-carrinho').forEach(btn => {
        btn.addEventListener('click', function () {
            const card = this.closest('[data-produto-nome]');
            if (!card) return;
            const nome = card.dataset.produtoNome || card.getAttribute('data-produto-nome');
            const preco = parseFloat(card.dataset.produtoPreco || card.getAttribute('data-produto-preco')) ||
                extrairPreco(card.querySelector('.produto-preco')?.textContent || '');
            adicionarCarrinho(nome, preco);
        });
    });

    atualizarCarrinho();
    atualizarBadge();
}

document.addEventListener('DOMContentLoaded', initCarrinho);
