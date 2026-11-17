# Chocomilka — Controle de Estoque

Sistema web desenvolvido em Python com Flask e SQLite para gerenciamento e controle de estoque de produtos.

## Como executar o projeto

1. Instale a biblioteca Flask pelo terminal:
   ```bash
  & "C:\Program Files\Python314\python.exe" -m pip install flask
   ```

2. Inicie o servidor local:
   ```bash
   python app.py
   ```

3. Abra o navegador e acesse:
   `http://127.0.0.1:5000`

## Estrutura do projeto

- `app.py`: rotas da aplicação e validações da API.
- `dao.py`: conexão e operações no banco de dados SQLite.
- `models.py`: modelo de dados da classe `Produto`.
- `chocomilka.db`: banco de dados com registros iniciais.
- `templates/index.html`: interface principal do sistema.
- `static/style.css` e `static/script.js`: estilos e interatividade da página.

## Funcionalidades

- Cadastro, edição e exclusão de produtos.
- Ajuste rápido de quantidade (+1 / -1) direto na listagem.
- Indicadores visuais de status do estoque (Em dia, Repor e Em falta).
- Busca dinâmica e filtros por situação do estoque.

- Fontes: Bricolage Grotesque e Instrument Sans (Google Fonts, com alternativa de sistema se estiver sem internet).
