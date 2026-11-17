# Chocomilka — Controle de Estoque (versão revisada)

## Como rodar
    pip install flask
    python app.py
Abra http://127.0.0.1:5000

## Estrutura
    app.py            rotas Flask (agora também serve a página)
    dao.py / models.py   mantidos (arquitetura do aluno preservada)
    templates/index.html
    static/style.css, static/script.js
    chocomilka.db

## Bugs corrigidos no projeto original
1. A rota "/" devolvia só JSON: a página nunca abria. Agora renderiza templates/index.html.
2. index.html estava em pasta errada, com <form> duplicado dentro do <head>, tags <main>/<section> fechadas sem abrir, e sem o campo #busca (o script.js quebrava na 1ª linha).
3. O botão Editar chamava GET /produtos/<id>, que não existia. Rota criada.
4. innerHTML com texto digitado pelo usuário (risco de XSS). Agora o texto é escapado.
5. Sem validação no servidor (int("abc") gerava erro 500, valores negativos eram aceitos). Agora retorna 400 com mensagem por campo.

## Design (UX/UI)
- Conceito: o estoque de cada produto é um "tablete" de 12 quadradinhos que vai esvaziando (cheio = 3x o mínimo). Cor e texto indicam Em dia / Repor / Em falta.
- Manchete em frase ("1 produto em falta e 2 para repor.") no lugar de cartões de números: a primeira coisa que se lê é o que precisa de ação.
- Lista ordenada por urgência, filtros com contagem, busca sem acento, ajuste rápido − / +.
- Cadastro/edição numa gaveta lateral; exclusão com confirmação que cita o produto; avisos (toasts) em vez de alert().
- Estados vazios com ação: "Carregar exemplos" (para demonstração) e "Servidor desligado" com instrução.
- Responsivo, teclado e leitores de tela (labels, aria, foco visível, alvos de 44px), respeita prefers-reduced-motion.
- Fontes: Bricolage Grotesque e Instrument Sans (Google Fonts, com alternativa de sistema se estiver sem internet).
