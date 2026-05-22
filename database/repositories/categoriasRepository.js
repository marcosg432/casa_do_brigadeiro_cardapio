const { getDb } = require('../db');

function listar() {
  return getDb().prepare(
    `SELECT id, nome, slug, ordem, tipo, titulo, subtitulo, descricao, status,
            parent_id, layout_key, configuracao_json, created_at, updated_at
     FROM categorias ORDER BY ordem ASC, id ASC`
  ).all();
}

function buscarPorId(id) {
  return getDb().prepare(
    `SELECT id, nome, slug, ordem, tipo, titulo, subtitulo, descricao, status,
            parent_id, layout_key, configuracao_json, created_at, updated_at
     FROM categorias WHERE id = ?`
  ).get(Number(id)) || null;
}

function inserir(row) {
  const db = getDb();
  const r = db.prepare(`
    INSERT INTO categorias (
      nome, slug, ordem, tipo, titulo, subtitulo, descricao, status,
      parent_id, layout_key, configuracao_json, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(
    row.nome,
    row.slug,
    Number(row.ordem) || 0,
    row.tipo || 'catalogo',
    row.titulo || null,
    row.subtitulo || null,
    row.descricao || null,
    row.status || 'ativo',
    row.parent_id != null ? Number(row.parent_id) : null,
    row.layout_key || null,
    row.configuracao_json || null
  );
  return buscarPorId(Number(r.lastInsertRowid));
}

function atualizar(id, patch) {
  if (!buscarPorId(id)) return null;
  const sets = [];
  const vals = [];
  const fields = [
    'nome', 'slug', 'ordem', 'tipo', 'titulo', 'subtitulo', 'descricao',
    'status', 'parent_id', 'layout_key', 'configuracao_json'
  ];
  fields.forEach((k) => {
    if (Object.prototype.hasOwnProperty.call(patch, k)) {
      sets.push(`${k} = ?`);
      let v = patch[k];
      if (k === 'ordem') v = Number(v) || 0;
      else if (k === 'parent_id') v = v != null ? Number(v) : null;
      vals.push(v);
    }
  });
  if (!sets.length) return buscarPorId(id);
  sets.push("updated_at = datetime('now')");
  vals.push(Number(id));
  getDb().prepare(`UPDATE categorias SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  return buscarPorId(id);
}

function deletar(id) {
  const r = getDb().prepare('DELETE FROM categorias WHERE id = ?').run(Number(id));
  return Number(r.changes) > 0;
}

module.exports = {
  listar,
  buscarPorId,
  inserir,
  atualizar,
  deletar
};
