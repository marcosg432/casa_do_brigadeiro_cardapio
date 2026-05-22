const { getDb } = require('../db');

const META_EDITADO_SO_LOCAL_PAYLOAD = '__editadoSomenteLocalEm';
/** Iso do SQLite; apenas leitura no cliente para fundir lista — não persistir dentro do payload JSON armazenado */
const META_ATUALIZADO_SERVIDOR = '_atualizadoServidorEm';

function stripMetadadosPayloadPersistencia(obj) {
  if (!obj || typeof obj !== 'object') return;
  delete obj[META_EDITADO_SO_LOCAL_PAYLOAD];
  delete obj[META_ATUALIZADO_SERVIDOR];
}

function aplicarLinhaAoPayload(parsed, linhaDb) {
  if (!parsed || typeof parsed !== 'object' || !linhaDb) return parsed;
  const o = parsed;
  o[META_ATUALIZADO_SERVIDOR] = linhaDb.updated_at;
  return o;
}

function textoOuNull(v) {
  if (v == null) return null;
  const s = String(v).trim();
  return s ? s : null;
}

function numeroMonetario(v) {
  if (v == null || v === '') return 0;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

function numeroInteiroOuNull(v) {
  if (v == null || v === '') return null;
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) ? n : null;
}

function entregaNormalizada(v) {
  const s = textoOuNull(v);
  if (s === 'Entrega' || s === 'Retirada') return s;
  if (s && s.toLowerCase().indexOf('entrega') === 0) return 'Entrega';
  if (s && s.toLowerCase().indexOf('retirada') === 0) return 'Retirada';
  return null;
}

function salvarSnapshotEstruturado(db, obj) {
  if (!obj || typeof obj !== 'object' || obj.id == null) return;
  const id = Number(obj.id);
  if (!Number.isFinite(id) || id <= 0) return;

  db.prepare('DELETE FROM orcamento_itens WHERE orcamento_id = ?').run(id);

  const nomeCliente = textoOuNull(obj.nome_cliente || obj.cliente || obj.nome);
  const telefone = textoOuNull(obj.telefone);
  if (nomeCliente && telefone) {
    db.prepare(`
      INSERT INTO orcamento_clientes (orcamento_id, nome, telefone, email, cpf, rg, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(orcamento_id) DO UPDATE SET
        nome = excluded.nome,
        telefone = excluded.telefone,
        email = excluded.email,
        cpf = excluded.cpf,
        rg = excluded.rg,
        updated_at = excluded.updated_at
    `).run(
      id,
      nomeCliente,
      telefone,
      textoOuNull(obj.email),
      textoOuNull(obj.cliente_cpf || obj.cpf),
      textoOuNull(obj.cliente_rg || obj.rg)
    );
  }

  db.prepare(`
    INSERT INTO orcamento_eventos (
      orcamento_id, data_evento, tipo_evento, convidados, local_evento,
      entrega_retirada, endereco_entrega, observacoes, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(orcamento_id) DO UPDATE SET
      data_evento = excluded.data_evento,
      tipo_evento = excluded.tipo_evento,
      convidados = excluded.convidados,
      local_evento = excluded.local_evento,
      entrega_retirada = excluded.entrega_retirada,
      endereco_entrega = excluded.endereco_entrega,
      observacoes = excluded.observacoes,
      updated_at = excluded.updated_at
  `).run(
    id,
    textoOuNull(obj.data_evento || obj.evento_data),
    textoOuNull(obj.tipo_evento || obj.evento_tipo),
    numeroInteiroOuNull(obj.convidados),
    textoOuNull(obj.local_evento || obj.local),
    entregaNormalizada(obj.entrega_retirada || obj.entrega),
    textoOuNull(obj.endereco || obj.endereco_entrega),
    textoOuNull(obj.observacoes)
  );

  const itens = Array.isArray(obj.itens) ? obj.itens : [];
  const insertItem = db.prepare(`
    INSERT INTO orcamento_itens (
      orcamento_id, produto_id, variacao_id, nome_snapshot, categoria_snapshot,
      quantidade, unidade, preco_unitario, subtotal, qtd_min, luxo, configuracao_json
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  itens.forEach((it) => {
    if (!it || typeof it !== 'object') return;
    const quantidade = Number(it.quantidade) || 1;
    const preco = numeroMonetario(it.preco_unitario != null ? it.preco_unitario : it.preco);
    const subtotal = numeroMonetario(it.subtotal != null ? it.subtotal : preco * quantidade);
    const config = {};
    ['opcoes', 'configuracao', 'personalizacao', 'observacao', 'sabores', 'massa', 'cobertura', 'estilo'].forEach((k) => {
      if (it[k] != null) config[k] = it[k];
    });
    insertItem.run(
      id,
      it.produto_id != null ? Number(it.produto_id) : null,
      it.variacao_id != null ? Number(it.variacao_id) : null,
      textoOuNull(it.nome) || 'Item do orçamento',
      textoOuNull(it.categoria || it.categoria_snapshot),
      quantidade,
      textoOuNull(it.unidade) || 'unidade',
      preco,
      subtotal,
      Math.max(1, parseInt(String(it.qtd_min != null ? it.qtd_min : it.qtdMin != null ? it.qtdMin : 1), 10) || 1),
      it.luxo === true ? 1 : 0,
      Object.keys(config).length ? JSON.stringify(config) : null
    );
  });

  db.prepare(`
    INSERT INTO orcamento_pagamentos (
      orcamento_id, forma_pagamento_ref, subtotal_produtos, taxa_entrega,
      desconto_tipo, desconto_valor, desconto_degustacao, desconto_cerimonialista,
      entrada, valor_final, restante, data_pagamento_entrada, data_pagamento_final,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(orcamento_id) DO UPDATE SET
      forma_pagamento_ref = excluded.forma_pagamento_ref,
      subtotal_produtos = excluded.subtotal_produtos,
      taxa_entrega = excluded.taxa_entrega,
      desconto_tipo = excluded.desconto_tipo,
      desconto_valor = excluded.desconto_valor,
      desconto_degustacao = excluded.desconto_degustacao,
      desconto_cerimonialista = excluded.desconto_cerimonialista,
      entrada = excluded.entrada,
      valor_final = excluded.valor_final,
      restante = excluded.restante,
      data_pagamento_entrada = excluded.data_pagamento_entrada,
      data_pagamento_final = excluded.data_pagamento_final,
      updated_at = excluded.updated_at
  `).run(
    id,
    textoOuNull(obj.forma_pagamento_ref || obj.forma_pagamento || obj.pagamento),
    numeroMonetario(obj.valor_original != null ? obj.valor_original : obj.total),
    numeroMonetario(obj.taxa_entrega),
    textoOuNull(obj.desconto_tipo),
    obj.desconto_valor == null ? null : numeroMonetario(obj.desconto_valor),
    numeroMonetario(obj.desconto_degustacao),
    numeroMonetario(obj.desconto_cerimonialista),
    numeroMonetario(obj.entrada),
    numeroMonetario(obj.valor_final != null ? obj.valor_final : obj.total),
    numeroMonetario(obj.restante),
    textoOuNull(obj.data_pagamento_entrada),
    textoOuNull(obj.data_pagamento_final)
  );
}

/**
 * Garante que cada item do orçamento respeita quantidade mínima (qtd_min / qtdMin).
 * @param {object} obj - payload do orçamento
 * @returns {string|null} mensagem de erro ou null
 */
function validarQuantidadesItensOrcamento(obj) {
  if (!obj || typeof obj !== 'object') return null;
  const itens = obj.itens;
  if (itens == null) return null;
  if (!Array.isArray(itens)) {
    return 'Campo "itens" deve ser uma lista.';
  }
  const PADRAO_MIN = 50;
  for (let i = 0; i < itens.length; i++) {
    const it = itens[i];
    if (!it || typeof it !== 'object') continue;
    const nome = String(it.nome || 'Produto').slice(0, 120);
    /* Complemento incluído manualmente no admin: sem regra de 50 un. do cardápio */
    if (it.extra_pedido_admin === true) {
      const q = parseInt(it.quantidade, 10);
      if (!Number.isFinite(q) || q < 1) {
        return `Quantidade inválida para "${nome}": informe pelo menos 1 unidade (complemento manual).`;
      }
      continue;
    }
    const rawMin = parseInt(
      it.qtd_min != null ? it.qtd_min : it.qtdMin != null ? it.qtdMin : PADRAO_MIN,
      10
    );
    const min =
      !Number.isFinite(rawMin) || rawMin < 1 ? PADRAO_MIN : Math.max(PADRAO_MIN, rawMin);
    const q = parseInt(it.quantidade, 10);
    if (!Number.isFinite(q) || q < min) {
      return `Quantidade inválida para "${nome}": o pedido mínimo é ${min} unidade(s).`;
    }
  }
  return null;
}

function listar() {
  const db = getDb();
  const rows = db.prepare(
    'SELECT id, payload, created_at, updated_at FROM orcamentos ORDER BY id DESC'
  ).all();
  return rows.map((r) => aplicarLinhaAoPayload(JSON.parse(r.payload), r));
}

function buscarPorId(id) {
  const db = getDb();
  const row = db.prepare('SELECT id, payload, updated_at FROM orcamentos WHERE id = ?').get(Number(id));
  if (!row) return null;
  return aplicarLinhaAoPayload(JSON.parse(row.payload), row);
}

function inserir(obj) {
  const errQtd = validarQuantidadesItensOrcamento(obj);
  if (errQtd) throw new Error(errQtd);
  stripMetadadosPayloadPersistencia(obj);
  const db = getDb();
  const id = Number(obj.id);
  if (!id || Number.isNaN(id)) {
    throw new Error('orçamento.id numérico obrigatório');
  }
  const payload = JSON.stringify(obj);
  const now = new Date().toISOString();
  const created = obj.data_criacao || obj.data || now;
  db.prepare(`
    INSERT INTO orcamentos (id, payload, created_at, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      payload = excluded.payload,
      updated_at = excluded.updated_at
  `).run(id, payload, created, now);
  salvarSnapshotEstruturado(db, obj);
  return buscarPorId(id);
}

function atualizar(id, patch) {
  const atual = buscarPorId(id);
  if (!atual) return null;
  const merged = Object.assign({}, atual, patch);
  merged.id = Number(id);
  stripMetadadosPayloadPersistencia(merged);
  const errQtd = validarQuantidadesItensOrcamento(merged);
  if (errQtd) throw new Error(errQtd);
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE orcamentos SET payload = ?, updated_at = ? WHERE id = ?
  `).run(JSON.stringify(merged), now, Number(id));
  salvarSnapshotEstruturado(db, merged);
  return buscarPorId(id);
}

function substituir(obj) {
  const errQtd = validarQuantidadesItensOrcamento(obj);
  if (errQtd) throw new Error(errQtd);
  stripMetadadosPayloadPersistencia(obj);
  const id = Number(obj.id);
  if (!id) throw new Error('id inválido');
  const db = getDb();
  const now = new Date().toISOString();
  const payload = JSON.stringify(obj);
  const created = obj.data_criacao || obj.data || now;
  db.prepare(`
    INSERT INTO orcamentos (id, payload, created_at, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      payload = excluded.payload,
      updated_at = excluded.updated_at
  `).run(id, payload, created, now);
  salvarSnapshotEstruturado(db, obj);
  return buscarPorId(id);
}

function deletar(id) {
  const db = getDb();
  const r = db.prepare('DELETE FROM orcamentos WHERE id = ?').run(Number(id));
  return Number(r.changes) > 0;
}

module.exports = {
  listar,
  buscarPorId,
  inserir,
  atualizar,
  substituir,
  deletar
};
