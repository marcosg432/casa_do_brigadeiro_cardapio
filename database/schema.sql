-- Schema canônico SQLite — Casa do Brigadeiro
-- O runtime usa database/db.js + database/migrations/*.sql.
-- Este arquivo documenta o estado desejado após as migrations 001 e 002.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    ordem INTEGER NOT NULL DEFAULT 0,
    tipo TEXT NOT NULL DEFAULT 'catalogo'
        CHECK (tipo IN ('catalogo', 'configuravel', 'especial', 'informativo')),
    titulo TEXT,
    subtitulo TEXT,
    descricao TEXT,
    status TEXT NOT NULL DEFAULT 'ativo'
        CHECK (status IN ('ativo', 'rascunho', 'arquivado')),
    parent_id INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
    layout_key TEXT,
    configuracao_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT
);

CREATE TABLE IF NOT EXISTS produtos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    categoria_id INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
    nome TEXT NOT NULL,
    preco REAL NOT NULL DEFAULT 0,
    imagem TEXT,
    descricao TEXT,
    ingredientes TEXT,
    pedido_texto TEXT,
    ativo INTEGER NOT NULL DEFAULT 1,
    slug TEXT UNIQUE,
    sku TEXT,
    tipo TEXT NOT NULL DEFAULT 'simples'
        CHECK (tipo IN ('simples', 'cento', 'unitario', 'kg', 'configuravel', 'informativo')),
    unidade_preco TEXT NOT NULL DEFAULT 'unidade'
        CHECK (unidade_preco IN ('unidade', 'cento', 'kg', 'tamanho', 'configuracao', 'sob_consulta')),
    qtd_min INTEGER NOT NULL DEFAULT 1 CHECK (qtd_min >= 1),
    ordem INTEGER NOT NULL DEFAULT 0,
    destaque INTEGER NOT NULL DEFAULT 0 CHECK (destaque IN (0, 1)),
    status TEXT NOT NULL DEFAULT 'ativo'
        CHECK (status IN ('ativo', 'rascunho', 'arquivado')),
    configuracao_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT
);

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
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

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

CREATE TABLE IF NOT EXISTS regras_venda_categoria (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    categoria_slug TEXT NOT NULL UNIQUE,
    nome TEXT NOT NULL,
    permite_unitario INTEGER NOT NULL DEFAULT 1 CHECK (permite_unitario IN (0, 1)),
    permite_cento INTEGER NOT NULL DEFAULT 1 CHECK (permite_cento IN (0, 1)),
    preco_unitario REAL NOT NULL DEFAULT 0,
    minimo_unitario INTEGER NOT NULL DEFAULT 10 CHECK (minimo_unitario >= 1),
    maximo_unitario INTEGER NOT NULL DEFAULT 49 CHECK (maximo_unitario >= minimo_unitario),
    unidades_por_cento INTEGER NOT NULL DEFAULT 50 CHECK (unidades_por_cento >= 1),
    multiplo_cento INTEGER NOT NULL DEFAULT 50 CHECK (multiplo_cento >= 1),
    regra_json TEXT,
    ativo INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orcamentos (
    id INTEGER PRIMARY KEY,
    payload TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

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

CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_produtos_ativo ON produtos(ativo);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria_ordem ON produtos(categoria_id, ordem, id);
CREATE INDEX IF NOT EXISTS idx_produtos_tipo ON produtos(tipo);
CREATE INDEX IF NOT EXISTS idx_produtos_status ON produtos(status);
CREATE INDEX IF NOT EXISTS idx_midias_entidade ON midias(entidade_tipo, entidade_id, papel, ordem);
CREATE INDEX IF NOT EXISTS idx_midias_ativo ON midias(ativo);
CREATE INDEX IF NOT EXISTS idx_variacoes_produto ON produto_variacoes(produto_id, ordem);
CREATE INDEX IF NOT EXISTS idx_variacoes_tipo ON produto_variacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_opcao_grupos_produto ON produto_opcao_grupos(produto_id, ordem);
CREATE INDEX IF NOT EXISTS idx_opcao_grupos_tipo ON produto_opcao_grupos(tipo);
CREATE INDEX IF NOT EXISTS idx_opcoes_grupo ON produto_opcoes(grupo_id, ordem);
CREATE INDEX IF NOT EXISTS idx_opcoes_ativo ON produto_opcoes(ativo);
CREATE INDEX IF NOT EXISTS idx_campos_produto ON produto_campos_personalizacao(produto_id, ordem);
CREATE INDEX IF NOT EXISTS idx_precos_produto ON produto_precos(produto_id, ativo);
CREATE INDEX IF NOT EXISTS idx_precos_variacao ON produto_precos(variacao_id);
CREATE INDEX IF NOT EXISTS idx_precos_opcao ON produto_precos(opcao_id);
CREATE INDEX IF NOT EXISTS idx_precos_vigencia ON produto_precos(vigencia_inicio, vigencia_fim);
CREATE INDEX IF NOT EXISTS idx_regras_produto ON produto_regras(produto_id, ativo, ordem);
CREATE INDEX IF NOT EXISTS idx_regras_venda_categoria_ativo ON regras_venda_categoria(ativo);
CREATE INDEX IF NOT EXISTS idx_orcamentos_updated ON orcamentos(updated_at);
CREATE INDEX IF NOT EXISTS idx_orcamentos_created ON orcamentos(created_at);
CREATE INDEX IF NOT EXISTS idx_orcamento_itens_orcamento ON orcamento_itens(orcamento_id);
CREATE INDEX IF NOT EXISTS idx_orcamento_itens_produto ON orcamento_itens(produto_id);
