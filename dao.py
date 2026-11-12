import sqlite3
import os
from models import Produto


class ProdutoDAO:
    def __init__(self):
        pasta = os.path.dirname(os.path.abspath(__file__))
        self.caminho_banco = os.path.join(pasta, "chocomilka.db")
        self.criar_tabela()

    def criar_tabela(self):
        with sqlite3.connect(self.caminho_banco) as conexao:
            cursor = conexao.cursor()

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS produtos (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nome TEXT NOT NULL,
                    categoria TEXT NOT NULL,
                    quantidade INTEGER NOT NULL,
                    estoque_minimo INTEGER NOT NULL,
                    localizacao TEXT NOT NULL
                )
            """)

            conexao.commit()

    def buscar_todos(self):
        with sqlite3.connect(self.caminho_banco) as conexao:
            cursor = conexao.cursor()

            cursor.execute("SELECT * FROM produtos")
            linhas = cursor.fetchall()

            return [Produto(*linha) for linha in linhas]

    def buscar_por_id(self, id_produto):
        with sqlite3.connect(self.caminho_banco) as conexao:
            cursor = conexao.cursor()

            cursor.execute(
                "SELECT * FROM produtos WHERE id = ?",
                (id_produto,)
            )

            linha = cursor.fetchone()

            if linha:
                return Produto(*linha)

            return None

    def inserir(self, produto):
        with sqlite3.connect(self.caminho_banco) as conexao:
            cursor = conexao.cursor()

            cursor.execute("""
                INSERT INTO produtos
                (nome, categoria, quantidade, estoque_minimo, localizacao)
                VALUES (?, ?, ?, ?, ?)
            """, (
                produto.nome,
                produto.categoria,
                produto.quantidade,
                produto.estoque_minimo,
                produto.localizacao
            ))

            conexao.commit()
            return cursor.lastrowid

    def atualizar(self, id_produto, produto):
        with sqlite3.connect(self.caminho_banco) as conexao:
            cursor = conexao.cursor()

            cursor.execute("""
                UPDATE produtos
                SET nome = ?, categoria = ?, quantidade = ?,
                    estoque_minimo = ?, localizacao = ?
                WHERE id = ?
            """, (
                produto.nome,
                produto.categoria,
                produto.quantidade,
                produto.estoque_minimo,
                produto.localizacao,
                id_produto
            ))

            conexao.commit()
            return cursor.rowcount > 0

    def remover(self, id_produto):
        with sqlite3.connect(self.caminho_banco) as conexao:
            cursor = conexao.cursor()

            cursor.execute(
                "DELETE FROM produtos WHERE id = ?",
                (id_produto,)
            )

            conexao.commit()
            return cursor.rowcount > 0
