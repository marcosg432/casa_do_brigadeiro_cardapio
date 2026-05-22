-- SQLite — arquitetura premium do cardápio Casa do Brigadeiro
-- Esta migration preserva as tabelas legadas (categorias, produtos, orcamentos)
-- e adiciona uma camada normalizada para categorias dinâmicas, produtos
-- configuráveis, mídia, regras de preço e snapshots estruturados de orçamento.

PRAGMA foreign_keys = ON;

-- Enriquecimento compatível das tabelas existentes.
ALTER TABLE categorias ADD COLUMN tipo TEXT NOT NULL DEFAULT 'catalogo'
    CHECK (tipo IN ('catalogo', 'configuravel', 'especial', 'informativo'));
ALTER TABLE categorias ADD COLUMN titulo TEXT;
ALTER TABLE categorias ADD COLUMN subtitulo TEXT;
ALTER TABLE categorias ADD COLUMN descricao TEXT;
ALTER TABLE categorias ADD COLUMN status TEXT NOT NULL DEFAULT 'ativo'
    CHECK (status IN ('ativo', 'rascunho', 'arquivado'));
ALTER TABLE categorias ADD COLUMN parent_id INTEGER REFERENCES categorias(id) ON DELETE SET NULL;
ALTER TABLE categorias ADD COLUMN layout_key TEXT;
ALTER TABLE categorias ADD COLUMN configuracao_json TEXT;
ALTER TABLE categorias ADD COLUMN updated_at TEXT;

ALTER TABLE produtos ADD COLUMN slug TEXT;
ALTER TABLE produtos ADD COLUMN sku TEXT;
ALTER TABLE produtos ADD COLUMN tipo TEXT NOT NULL DEFAULT 'simples'
    CHECK (tipo IN ('simples', 'cento', 'unitario', 'kg', 'configuravel', 'informativo'));
ALTER TABLE produtos ADD COLUMN unidade_preco TEXT NOT NULL DEFAULT 'unidade'
    CHECK (unidade_preco IN ('unidade', 'cento', 'kg', 'tamanho', 'configuracao', 'sob_consulta'));
ALTER TABLE produtos ADD COLUMN qtd_min INTEGER NOT NULL DEFAULT 1 CHECK (qtd_min >= 1);
ALTER TABLE produtos ADD COLUMN ordem INTEGER NOT NULL DEFAULT 0;
ALTER TABLE produtos ADD COLUMN destaque INTEGER NOT NULL DEFAULT 0 CHECK (destaque IN (0, 1));
ALTER TABLE produtos ADD COLUMN status TEXT NOT NULL DEFAULT 'ativo'
    CHECK (status IN ('ativo', 'rascunho', 'arquivado'));
ALTER TABLE produtos ADD COLUMN configuracao_json TEXT;
ALTER TABLE produtos ADD COLUMN updated_at TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_produtos_slug ON produtos(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_produtos_categoria_ordem ON produtos(categoria_id, ordem, id);
CREATE INDEX IF NOT EXISTS idx_produtos_tipo ON produtos(tipo);
CREATE INDEX IF NOT EXISTS idx_produtos_status ON produtos(status);

UPDATE categorias SET updated_at = COALESCE(updated_at, created_at, datetime('now'));
UPDATE produtos SET updated_at = COALESCE(updated_at, created_at, datetime('now'));

-- Mídia flexível: hero, thumbnail, galeria, banner e imagens editoriais.
CREATE TABLE IF NOT EXISTS midias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entidade_tipo TEXT NOT NULL CHECK (entidade_tipo IN ('categoria', 'produto', 'opcao', 'site')),
    entidade_id INTEGER,
    papel TEXT NOT NULL CHECK (papel IN ('hero', 'thumbnail', 'banner', 'galeria', 'editorial', 'icone')),
    url TEXT NOT NULL,
    alt TEXT,
    foco_x REAL DEFAULT 0.5 CHECK (foco_x >= 0 AND foco_x <= 1),
    foco_y REAL DEFAULT 0.5 CHECK (foco_y >= 0 AND foco_y <= 1),
    ordem INTEGER NOT NULL DEFAULT 0,
    ativo INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0, 1)),
    metadados_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_midias_entidade ON midias(entidade_tipo, entidade_id, papel, ordem);
CREATE INDEX IF NOT EXISTS idx_midias_ativo ON midias(ativo);

-- Variações de produto: tamanho, peso, rendimento, variante tradicional/especial etc.
CREATE TABLE IF NOT EXISTS produto_variacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    produto_id INTEGER NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
    slug TEXT NOT NULL,
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('tamanho', 'peso', 'rendimento', 'variante', 'modelo', 'combo')),
    descricao TEXT,
    peso_gramas INTEGER,
    peso_kg REAL,
    fatias_min INTEGER,
    fatias_max INTEGER,
    diametro_cm REAL,
    qtd_min INTEGER CHECK (qtd_min IS NULL OR qtd_min >= 1),
    ordem INTEGER NOT NULL DEFAULT 0,
    ativo INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0, 1)),
    metadados_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (produto_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_variacoes_produto ON produto_variacoes(produto_id, ordem);
CREATE INDEX IF NOT EXISTS idx_variacoes_tipo ON produto_variacoes(tipo);

-- Grupos de opções reutilizáveis por produto: sabores, massas, coberturas, estilos etc.
CREATE TABLE IF NOT EXISTS produto_opcao_grupos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    produto_id INTEGER NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
    slug TEXT NOT NULL,
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('sabor', 'massa', 'cobertura', 'recheio', 'estilo', 'adicional', 'personalizacao', 'observacao')),
    selecao_min INTEGER NOT NULL DEFAULT 0 CHECK (selecao_min >= 0),
    selecao_max INTEGER NOT NULL DEFAULT 1 CHECK (selecao_max >= 1),
    obrigatorio INTEGER NOT NULL DEFAULT 0 CHECK (obrigatorio IN (0, 1)),
    layout TEXT NOT NULL DEFAULT 'cards' CHECK (layout IN ('cards', 'pills', 'lista', 'texto', 'textarea')),
    ordem INTEGER NOT NULL DEFAULT 0,
    ativo INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0, 1)),
    metadados_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (produto_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_opcao_grupos_produto ON produto_opcao_grupos(produto_id, ordem);
CREATE INDEX IF NOT EXISTS idx_opcao_grupos_tipo ON produto_opcao_grupos(tipo);

CREATE TABLE IF NOT EXISTS produto_opcoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    grupo_id INTEGER NOT NULL REFERENCES produto_opcao_grupos(id) ON DELETE CASCADE,
    slug TEXT NOT NULL,
    nome TEXT NOT NULL,
    descricao TEXT,
    preco_delta REAL NOT NULL DEFAULT 0,
    peso_delta_gramas INTEGER,
    imagem TEXT,
    ordem INTEGER NOT NULL DEFAULT 0,
    ativo INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0, 1)),
    metadados_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (grupo_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_opcoes_grupo ON produto_opcoes(grupo_id, ordem);
CREATE INDEX IF NOT EXISTS idx_opcoes_ativo ON produto_opcoes(ativo);

-- Campos livres de personalização: frase, nome, observação, data etc.
CREATE TABLE IF NOT EXISTS produto_campos_personalizacao (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    produto_id INTEGER NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
    slug TEXT NOT NULL,
    rotulo TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('texto_curto', 'texto_longo', 'numero', 'data', 'select')),
    obrigatorio INTEGER NOT NULL DEFAULT 0 CHECK (obrigatorio IN (0, 1)),
    placeholder TEXT,
    ajuda TEXT,
    min_length INTEGER,
    max_length INTEGER,
    ordem INTEGER NOT NULL DEFAULT 0,
    ativo INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0, 1)),
    metadados_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (produto_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_campos_produto ON produto_campos_personalizacao(produto_id, ordem);

-- Preços por contexto: base, variação, combinação de opção/variação e regras futuras.
CREATE TABLE IF NOT EXISTS produto_precos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    produto_id INTEGER NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
    variacao_id INTEGER REFERENCES produto_variacoes(id) ON DELETE CASCADE,
    opcao_id INTEGER REFERENCES produto_opcoes(id) ON DELETE CASCADE,
    tipo_preco TEXT NOT NULL CHECK (tipo_preco IN ('base', 'delta', 'fixo', 'por_kg', 'por_cento', 'sob_consulta')),
    valor REAL NOT NULL DEFAULT 0,
    moeda TEXT NOT NULL DEFAULT 'BRL',
    quantidade_base INTEGER NOT NULL DEFAULT 1 CHECK (quantidade_base >= 1),
    vigencia_inicio TEXT,
    vigencia_fim TEXT,
    ativo INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0, 1)),
    regra_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    CHECK (
        (vigencia_inicio IS NULL OR vigencia_fim IS NULL)
        OR datetime(vigencia_inicio) <= datetime(vigencia_fim)
    )
);

CREATE INDEX IF NOT EXISTS idx_precos_produto ON produto_precos(produto_id, ativo);
CREATE INDEX IF NOT EXISTS idx_precos_variacao ON produto_precos(variacao_id);
CREATE INDEX IF NOT EXISTS idx_precos_opcao ON produto_precos(opcao_id);
CREATE INDEX IF NOT EXISTS idx_precos_vigencia ON produto_precos(vigencia_inicio, vigencia_fim);

-- Restrições/regras de configurador: disponibilidade, dependências e limites.
CREATE TABLE IF NOT EXISTS produto_regras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    produto_id INTEGER NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
    escopo TEXT NOT NULL CHECK (escopo IN ('produto', 'variacao', 'grupo', 'opcao', 'preco')),
    nome TEXT NOT NULL,
    descricao TEXT,
    regra_json TEXT NOT NULL,
    ativo INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0, 1)),
    ordem INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_regras_produto ON produto_regras(produto_id, ativo, ordem);

-- Snapshots estruturados do orçamento sem remover o payload JSON legado.
CREATE TABLE IF NOT EXISTS orcamento_clientes (
    orcamento_id INTEGER PRIMARY KEY REFERENCES orcamentos(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    telefone TEXT NOT NULL,
    email TEXT,
    cpf TEXT,
    rg TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orcamento_eventos (
    orcamento_id INTEGER PRIMARY KEY REFERENCES orcamentos(id) ON DELETE CASCADE,
    data_evento TEXT,
    tipo_evento TEXT,
    convidados INTEGER CHECK (convidados IS NULL OR convidados >= 0),
    local_evento TEXT,
    entrega_retirada TEXT CHECK (entrega_retirada IS NULL OR entrega_retirada IN ('Entrega', 'Retirada')),
    endereco_entrega TEXT,
    observacoes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orcamento_itens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orcamento_id INTEGER NOT NULL REFERENCES orcamentos(id) ON DELETE CASCADE,
    produto_id INTEGER REFERENCES produtos(id) ON DELETE SET NULL,
    variacao_id INTEGER REFERENCES produto_variacoes(id) ON DELETE SET NULL,
    nome_snapshot TEXT NOT NULL,
    categoria_snapshot TEXT,
    quantidade REAL NOT NULL CHECK (quantidade > 0),
    unidade TEXT NOT NULL DEFAULT 'unidade',
    preco_unitario REAL NOT NULL DEFAULT 0,
    subtotal REAL NOT NULL DEFAULT 0,
    qtd_min INTEGER NOT NULL DEFAULT 1 CHECK (qtd_min >= 1),
    luxo INTEGER NOT NULL DEFAULT 0 CHECK (luxo IN (0, 1)),
    configuracao_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_orcamento_itens_orcamento ON orcamento_itens(orcamento_id);
CREATE INDEX IF NOT EXISTS idx_orcamento_itens_produto ON orcamento_itens(produto_id);

CREATE TABLE IF NOT EXISTS orcamento_pagamentos (
    orcamento_id INTEGER PRIMARY KEY REFERENCES orcamentos(id) ON DELETE CASCADE,
    forma_pagamento_ref TEXT,
    subtotal_produtos REAL NOT NULL DEFAULT 0,
    taxa_entrega REAL NOT NULL DEFAULT 0,
    desconto_tipo TEXT CHECK (desconto_tipo IS NULL OR desconto_tipo IN ('reais', 'percentual')),
    desconto_valor REAL,
    desconto_degustacao REAL NOT NULL DEFAULT 0,
    desconto_cerimonialista REAL NOT NULL DEFAULT 0,
    entrada REAL NOT NULL DEFAULT 0,
    valor_final REAL NOT NULL DEFAULT 0,
    restante REAL NOT NULL DEFAULT 0,
    data_pagamento_entrada TEXT,
    data_pagamento_final TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_orcamentos_created ON orcamentos(created_at);
