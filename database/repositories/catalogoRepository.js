const { getDb } = require('../db');

function listarMidias(entidadeTipo, entidadeId) {
  return getDb().prepare(`
    SELECT id, entidade_tipo, entidade_id, papel, url, alt, foco_x, foco_y,
           ordem, ativo, metadados_json, created_at, updated_at
    FROM midias
    WHERE entidade_tipo = ? AND entidade_id = ? AND ativo = 1
    ORDER BY papel ASC, ordem ASC, id ASC
  `).all(entidadeTipo, Number(entidadeId));
}

function listarVariacoes(produtoId) {
  return getDb().prepare(`
    SELECT id, produto_id, slug, nome, tipo, descricao, peso_gramas, peso_kg,
           fatias_min, fatias_max, diametro_cm, qtd_min, ordem, ativo,
           metadados_json, created_at, updated_at
    FROM produto_variacoes
    WHERE produto_id = ? AND ativo = 1
    ORDER BY ordem ASC, id ASC
  `).all(Number(produtoId));
}

function listarGruposOpcoes(produtoId) {
  const db = getDb();
  const grupos = db.prepare(`
    SELECT id, produto_id, slug, nome, tipo, selecao_min, selecao_max,
           obrigatorio, layout, ordem, ativo, metadados_json, created_at, updated_at
    FROM produto_opcao_grupos
    WHERE produto_id = ? AND ativo = 1
    ORDER BY ordem ASC, id ASC
  `).all(Number(produtoId));

  const opcoesStmt = db.prepare(`
    SELECT id, grupo_id, slug, nome, descricao, preco_delta, peso_delta_gramas,
           imagem, ordem, ativo, metadados_json, created_at, updated_at
    FROM produto_opcoes
    WHERE grupo_id = ? AND ativo = 1
    ORDER BY ordem ASC, id ASC
  `);

  return grupos.map((grupo) => Object.assign({}, grupo, {
    opcoes: opcoesStmt.all(grupo.id)
  }));
}

function listarCamposPersonalizacao(produtoId) {
  return getDb().prepare(`
    SELECT id, produto_id, slug, rotulo, tipo, obrigatorio, placeholder, ajuda,
           min_length, max_length, ordem, ativo, metadados_json, created_at, updated_at
    FROM produto_campos_personalizacao
    WHERE produto_id = ? AND ativo = 1
    ORDER BY ordem ASC, id ASC
  `).all(Number(produtoId));
}

function listarPrecos(produtoId) {
  return getDb().prepare(`
    SELECT id, produto_id, variacao_id, opcao_id, tipo_preco, valor, moeda,
           quantidade_base, vigencia_inicio, vigencia_fim, ativo, regra_json,
           created_at, updated_at
    FROM produto_precos
    WHERE produto_id = ? AND ativo = 1
    ORDER BY tipo_preco ASC, id ASC
  `).all(Number(produtoId));
}

function listarRegras(produtoId) {
  return getDb().prepare(`
    SELECT id, produto_id, escopo, nome, descricao, regra_json, ativo, ordem,
           created_at, updated_at
    FROM produto_regras
    WHERE produto_id = ? AND ativo = 1
    ORDER BY ordem ASC, id ASC
  `).all(Number(produtoId));
}

function montarProduto(produto) {
  return Object.assign({}, produto, {
    midias: listarMidias('produto', produto.id),
    variacoes: listarVariacoes(produto.id),
    grupos_opcoes: listarGruposOpcoes(produto.id),
    campos_personalizacao: listarCamposPersonalizacao(produto.id),
    precos: listarPrecos(produto.id),
    regras: listarRegras(produto.id)
  });
}

function listarProdutosCategoria(categoriaId) {
  return getDb().prepare(`
    SELECT id, categoria_id, nome, preco, imagem, descricao, ingredientes,
           pedido_texto, ativo, slug, sku, tipo, unidade_preco, qtd_min,
           ordem, destaque, status, configuracao_json, created_at, updated_at
    FROM produtos
    WHERE categoria_id = ? AND ativo = 1 AND status = 'ativo'
    ORDER BY ordem ASC, id ASC
  `).all(Number(categoriaId)).map(montarProduto);
}

function montarCategoria(categoria) {
  return Object.assign({}, categoria, {
    midias: listarMidias('categoria', categoria.id),
    produtos: listarProdutosCategoria(categoria.id)
  });
}

function listarCategoriasBase(whereSql, params) {
  return getDb().prepare(`
    SELECT id, nome, slug, ordem, tipo, titulo, subtitulo, descricao, status,
           parent_id, layout_key, configuracao_json, created_at, updated_at
    FROM categorias
    ${whereSql}
    ORDER BY ordem ASC, id ASC
  `).all(...params).map(montarCategoria);
}

function listar() {
  return listarCategoriasBase("WHERE status = 'ativo'", []);
}

function buscarCategoriaPorSlug(slug) {
  const rows = listarCategoriasBase("WHERE status = 'ativo' AND slug = ?", [slug]);
  return rows[0] || null;
}

module.exports = {
  listar,
  buscarCategoriaPorSlug
};
