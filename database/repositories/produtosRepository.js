const { getDb } = require('../db');

function listar() {
  return getDb().prepare(`
    SELECT id, categoria_id, nome, preco, imagem, descricao, ingredientes, pedido_texto,
           ativo, slug, sku, tipo, unidade_preco, qtd_min, ordem, destaque, status,
           configuracao_json, created_at, updated_at
    FROM produtos ORDER BY ordem ASC, id ASC
  `).all();
}

function buscarPorId(id) {
  return getDb().prepare(`
    SELECT id, categoria_id, nome, preco, imagem, descricao, ingredientes, pedido_texto,
           ativo, slug, sku, tipo, unidade_preco, qtd_min, ordem, destaque, status,
           configuracao_json, created_at, updated_at
    FROM produtos WHERE id = ?
  `).get(Number(id)) || null;
}

function inserir(row) {
  const db = getDb();
  const r = db.prepare(`
    INSERT INTO produtos (
      categoria_id, nome, preco, imagem, descricao, ingredientes, pedido_texto, ativo,
      slug, sku, tipo, unidade_preco, qtd_min, ordem, destaque, status, configuracao_json,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(
    row.categoria_id != null ? Number(row.categoria_id) : null,
    row.nome,
    Number(row.preco) || 0,
    row.imagem || null,
    row.descricao || null,
    row.ingredientes || null,
    row.pedido_texto || null,
    row.ativo === 0 ? 0 : 1,
    row.slug || null,
    row.sku || null,
    row.tipo || 'simples',
    row.unidade_preco || 'unidade',
    row.qtd_min != null ? Math.max(1, Number(row.qtd_min) || 1) : 1,
    Number(row.ordem) || 0,
    row.destaque === 1 || row.destaque === true ? 1 : 0,
    row.status || 'ativo',
    row.configuracao_json || null
  );
  const lid = Number(r.lastInsertRowid);
  return buscarPorId(lid);
}

function atualizar(id, patch) {
  if (!buscarPorId(id)) return null;
  const sets = [];
  const vals = [];
  const fields = [
    'categoria_id', 'nome', 'preco', 'imagem', 'descricao', 'ingredientes',
    'pedido_texto', 'ativo', 'slug', 'sku', 'tipo', 'unidade_preco', 'qtd_min',
    'ordem', 'destaque', 'status', 'configuracao_json'
  ];
  fields.forEach((k) => {
    if (Object.prototype.hasOwnProperty.call(patch, k)) {
      sets.push(`${k} = ?`);
      let v = patch[k];
      if (k === 'preco') v = Number(v) || 0;
      else if (k === 'categoria_id') v = v != null ? Number(v) : null;
      else if (k === 'ativo') v = v === 0 || v === false ? 0 : 1;
      else if (k === 'destaque') v = v === 1 || v === true ? 1 : 0;
      else if (k === 'qtd_min') v = Math.max(1, Number(v) || 1);
      else if (k === 'ordem') v = Number(v) || 0;
      vals.push(v);
    }
  });
  if (!sets.length) return buscarPorId(id);
  sets.push("updated_at = datetime('now')");
  vals.push(Number(id));
  getDb().prepare(`UPDATE produtos SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  return buscarPorId(id);
}

function deletar(id) {
  const r = getDb().prepare('DELETE FROM produtos WHERE id = ?').run(Number(id));
  return Number(r.changes) > 0;
}

module.exports = {
  listar,
  buscarPorId,
  inserir,
  atualizar,
  deletar
};
