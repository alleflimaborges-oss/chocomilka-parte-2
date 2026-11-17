from flask import Flask, request, jsonify, render_template
from dao import ProdutoDAO
from models import Produto

app = Flask(__name__)
dao = ProdutoDAO()


# ---------------------------------------------------------------
# VALIDAÇÃO
# Mensagens claras e por campo, para o front-end mostrar o erro
# junto do input certo (UX: erro perto de onde o problema está).
# ---------------------------------------------------------------
def validar_dados(dados):
    erros = {}

    if not isinstance(dados, dict):
        return None, {"geral": "Envie os dados em formato JSON."}

    for campo, rotulo in (("nome", "Nome"),
                          ("categoria", "Categoria"),
                          ("localizacao", "Localização")):
        valor = str(dados.get(campo, "")).strip()
        if not valor:
            erros[campo] = f"{rotulo} é obrigatório."
        elif len(valor) > 80:
            erros[campo] = f"{rotulo} deve ter no máximo 80 caracteres."
        else:
            dados[campo] = valor

    for campo, rotulo in (("quantidade", "Quantidade"),
                          ("estoque_minimo", "Estoque mínimo")):
        try:
            numero = int(dados.get(campo))
            if numero < 0:
                erros[campo] = f"{rotulo} não pode ser negativo."
            else:
                dados[campo] = numero
        except (TypeError, ValueError):
            erros[campo] = f"{rotulo} deve ser um número inteiro."

    return dados, erros


def resposta_erro(erros):
    return jsonify({
        "erro": "Corrija os campos destacados.",
        "campos": erros
    }), 400


# ---------------------------------------------------------------
# PÁGINA
# ---------------------------------------------------------------
@app.route("/")
def inicio():
    return render_template("index.html")


# ---------------------------------------------------------------
# API
# ---------------------------------------------------------------
@app.route("/produtos", methods=["GET"])
def listar_produtos():
    produtos = dao.buscar_todos()
    return jsonify([produto.to_dict() for produto in produtos])


@app.route("/produtos/<int:id_produto>", methods=["GET"])
def buscar_produto(id_produto):
    produto = dao.buscar_por_id(id_produto)

    if produto is None:
        return jsonify({"erro": "Produto não encontrado"}), 404

    return jsonify(produto.to_dict())


@app.route("/produtos", methods=["POST"])
def criar_produto():
    dados, erros = validar_dados(request.get_json(silent=True))
    if erros:
        return resposta_erro(erros)

    produto = Produto(
        None,
        dados["nome"],
        dados["categoria"],
        dados["quantidade"],
        dados["estoque_minimo"],
        dados["localizacao"]
    )

    id_gerado = dao.inserir(produto)

    return jsonify({
        "mensagem": "Produto cadastrado!",
        "id": id_gerado
    }), 201


@app.route("/produtos/<int:id_produto>", methods=["PUT"])
def atualizar_produto(id_produto):
    dados, erros = validar_dados(request.get_json(silent=True))
    if erros:
        return resposta_erro(erros)

    produto = Produto(
        id_produto,
        dados["nome"],
        dados["categoria"],
        dados["quantidade"],
        dados["estoque_minimo"],
        dados["localizacao"]
    )

    if dao.atualizar(id_produto, produto):
        return jsonify({"mensagem": "Produto atualizado!"})

    return jsonify({"erro": "Produto não encontrado"}), 404


@app.route("/produtos/<int:id_produto>/quantidade", methods=["PATCH"])
def ajustar_quantidade(id_produto):
    """Ajuste rápido (+1 / -1) direto na tabela, sem abrir o formulário."""
    dados = request.get_json(silent=True) or {}

    try:
        delta = int(dados.get("delta"))
    except (TypeError, ValueError):
        return jsonify({"erro": "Informe um 'delta' inteiro."}), 400

    produto = dao.buscar_por_id(id_produto)
    if produto is None:
        return jsonify({"erro": "Produto não encontrado"}), 404

    produto.quantidade = max(0, produto.quantidade + delta)
    dao.atualizar(id_produto, produto)

    return jsonify(produto.to_dict())


@app.route("/produtos/<int:id_produto>", methods=["DELETE"])
def remover_produto(id_produto):
    if dao.remover(id_produto):
        return jsonify({"mensagem": "Produto removido!"})

    return jsonify({"erro": "Produto não encontrado"}), 404


if __name__ == "__main__":
    app.run(debug=True)
