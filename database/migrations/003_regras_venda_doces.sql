-- SQLite — regras comerciais de venda para categorias de doces

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

CREATE INDEX IF NOT EXISTS idx_regras_venda_categoria_ativo ON regras_venda_categoria(ativo);

INSERT INTO regras_venda_categoria (
    categoria_slug, nome, preco_unitario, minimo_unitario, maximo_unitario,
    unidades_por_cento, multiplo_cento, regra_json
) VALUES
    ('docinhos-tradicionais', 'Docinhos Tradicionais', 1.80, 10, 49, 50, 50, '{"cento":"valor_fixo_cadastrado"}'),
    ('brigadeiros-belga', 'Brigadeiros Belga', 3.50, 10, 49, 50, 50, '{"cento":"valor_fixo_cadastrado"}'),
    ('brigadeiros-recheados', 'Brigadeiros Recheados', 3.80, 10, 49, 50, 50, '{"cento":"valor_fixo_cadastrado"}'),
    ('brigadeiros-especiais', 'Brigadeiros Especiais', 4.10, 10, 49, 50, 50, '{"cento":"valor_fixo_cadastrado"}'),
    ('doces-especiais', 'Doces Especiais', 4.10, 10, 49, 50, 50, '{"cento":"valor_fixo_cadastrado"}')
ON CONFLICT(categoria_slug) DO UPDATE SET
    nome = excluded.nome,
    preco_unitario = excluded.preco_unitario,
    minimo_unitario = excluded.minimo_unitario,
    maximo_unitario = excluded.maximo_unitario,
    unidades_por_cento = excluded.unidades_por_cento,
    multiplo_cento = excluded.multiplo_cento,
    regra_json = excluded.regra_json,
    ativo = 1,
    updated_at = datetime('now');
