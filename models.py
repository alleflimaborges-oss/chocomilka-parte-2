class Produto:
    def __init__(self, id, nome, categoria, quantidade, estoque_minimo, localizacao):
        self.id = id
        self.nome = nome
        self.categoria = categoria
        self.quantidade = quantidade
        self.estoque_minimo = estoque_minimo
        self.localizacao = localizacao

    def to_dict(self):
        return {
            "id": self.id,
            "nome": self.nome,
            "categoria": self.categoria,
            "quantidade": self.quantidade,
            "estoque_minimo": self.estoque_minimo,
            "localizacao": self.localizacao
        }
