import flask 
from dao import ProdutoDAO
from models import Produto

app = flask.Flask(__name__)
dao = ProdutoDAO()


@app.route("/")
def inicio():
    return flask.jsonify({"mensagem": "Chocomilka funcionando!"})


@app.route("/produtos", methods=["GET"])
def listar_produtos():
    produtos = dao.buscar_todos()
    return flask.jsonify([produto.to_dict() for produto in produtos])


@app.route("/produtos", methods=["POST"])
def criar_produto():
    dados = flask.request.json

    produto = Produto(
        None,
        dados["nome"],
        dados["categoria"],
        int(dados["quantidade"]),
        int(dados["estoque_minimo"]),
        dados["localizacao"]
    )

    id_gerado = dao.inserir(produto)

    return flask.jsonify({
        "mensagem": "Produto cadastrado!",
        "id": id_gerado
    }), 201


@app.route("/produtos/<int:id_produto>", methods=["PUT"])
def atualizar_produto(id_produto):
    dados = flask.request.json

    produto = Produto(
        id_produto,
        dados["nome"],
        dados["categoria"],
        int(dados["quantidade"]),
        int(dados["estoque_minimo"]),
        dados["localizacao"]
    )

    atualizado = dao.atualizar(id_produto, produto)

    if atualizado:
        return flask.jsonify({"mensagem": "Produto atualizado!"})

    return flask.jsonify({"erro": "Produto não encontrado"}), 404


@app.route("/produtos/<int:id_produto>", methods=["DELETE"])
def remover_produto(id_produto):
    removido = dao.remover(id_produto)

    if removido:
        return flask.jsonify({"mensagem": "Produto removido!"})

    return flask.jsonify({"erro": "Produto não encontrado"}), 404


if __name__ == "__main__":
    app.run(debug=True)
    
