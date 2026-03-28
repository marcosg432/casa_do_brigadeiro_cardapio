-- Schema PostgreSQL — Sistema de orçamentos (confeitaria / eventos)
-- Execute no Supabase, Neon, ou PostgreSQL da Hostinger (com Node/API).

CREATE TABLE IF NOT EXISTS clientes (
    id              BIGSERIAL PRIMARY KEY,
    nome            VARCHAR(255) NOT NULL,
    telefone        VARCHAR(50) NOT NULL,
    email           VARCHAR(255),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS produtos (
    id              BIGSERIAL PRIMARY KEY,
    nome            VARCHAR(255) NOT NULL,
    categoria       VARCHAR(120),
    preco           NUMERIC(12, 2) NOT NULL DEFAULT 0,
    foto            TEXT,
    descricao       TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE status_orcamento AS ENUM (
    'novo_orcamento',
    'degustacao_agendada',
    'degustacao_realizada',
    'desconto_aplicado',
    'contrato_gerado',
    'fechado',
    'perdido'
);

CREATE TABLE IF NOT EXISTS orcamentos (
    id                      BIGSERIAL PRIMARY KEY,
    cliente_id              BIGINT REFERENCES clientes(id) ON DELETE SET NULL,
    data_evento             DATE NOT NULL,
    tipo_evento             VARCHAR(120) NOT NULL,
    convidados              INT NOT NULL,
    local_evento            TEXT NOT NULL,
    entrega_retirada        VARCHAR(20) NOT NULL,
    endereco_entrega        TEXT,
    observacoes             TEXT,
    forma_pagamento_ref     VARCHAR(80),
    valor_original          NUMERIC(12, 2) NOT NULL DEFAULT 0,
    desconto_tipo           VARCHAR(20),
    desconto_valor          NUMERIC(12, 4),
    valor_final             NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status                  status_orcamento NOT NULL DEFAULT 'novo_orcamento',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS itens_orcamento (
    id                  BIGSERIAL PRIMARY KEY,
    orcamento_id        BIGINT NOT NULL REFERENCES orcamentos(id) ON DELETE CASCADE,
    produto_id          BIGINT REFERENCES produtos(id) ON DELETE SET NULL,
    nome_snapshot       VARCHAR(255) NOT NULL,
    quantidade          INT NOT NULL CHECK (quantidade > 0),
    preco_unitario      NUMERIC(12, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS contratos (
    id                  BIGSERIAL PRIMARY KEY,
    orcamento_id        BIGINT NOT NULL REFERENCES orcamentos(id) ON DELETE CASCADE,
    valor_final         NUMERIC(12, 2) NOT NULL,
    data_contrato       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status              VARCHAR(40) NOT NULL DEFAULT 'rascunho',
    observacoes_snapshot TEXT
);

CREATE INDEX IF NOT EXISTS idx_orcamentos_status ON orcamentos(status);
CREATE INDEX IF NOT EXISTS idx_orcamentos_data_evento ON orcamentos(data_evento);
CREATE INDEX IF NOT EXISTS idx_itens_orcamento_pedido ON itens_orcamento(orcamento_id);
