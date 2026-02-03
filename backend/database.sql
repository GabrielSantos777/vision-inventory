-- Catálogo de Produtos e Metas
CREATE TABLE produtos_estoque(
    id SERIAL PRIMARY KEY,
    nome_label VARCHAR(50) UNIQUE NOT NULL,
    nome_exibicao VARCHAR(100),
    estoque_minimo INT DEFAULT 5,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Histórico de Leituras da IA
CREATE TABLE historico_deteccoes(
    id SERIAL PRIMARY KEY,
    produto_id INT REFERENCES produtos_estoque(id),
    quantidade_detectada INT NOT NULL,
    data_leitura TIMESTAMPTZ DEFAULT NOW()
);

-- Testes de inserção de dados
INSERT INTO produtos_estoque (nome_label, nome_exibicao, estoque_minimo) VALUES ('bottle', 'Garrafa de Água', 10),
('cup', 'Copo de Café', 15),
('cell phone', 'Smartphone de Teste', 2);


