-- SQLite — orçamentos, produtos e categorias (cardápio Casa do Brigadeiro)

CREATE TABLE IF NOT EXISTS categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    ordem INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS produtos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    categoria_id INTEGER,
    nome TEXT NOT NULL,
    preco REAL NOT NULL DEFAULT 0,
    imagem TEXT,
    descricao TEXT,
    ingredientes TEXT,
    pedido_texto TEXT,
    ativo INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_produtos_ativo ON produtos(ativo);

CREATE TABLE IF NOT EXISTS orcamentos (
    id INTEGER PRIMARY KEY,
    payload TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_orcamentos_updated ON orcamentos(updated_at);
