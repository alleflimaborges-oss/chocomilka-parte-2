const API = "/produtos";
const PECAS = 12;            // quadradinhos do tablete
const FATOR_CHEIO = 3;       // tablete cheio = 3x o estoque mínimo

const $ = (id) => document.getElementById(id);

const formulario = $("formProduto");
const lista      = $("lista");
const modalForm  = $("modalForm");
const modalExcluir = $("modalExcluir");
const campos = ["nome", "categoria", "quantidade", "estoque_minimo", "localizacao"];

let produtos = [];
let filtro = "todos";
let idParaExcluir = null;
let idRecemSalvo = null;
let falhaConexao = false;

const EXEMPLOS = [
    ["Barra ao leite 90 g", "Barras", 120, 30, "Prateleira A1"],
    ["Barra meio amargo 70%", "Barras", 24, 25, "Prateleira A2"],
    ["Bombom trufado", "Bombons", 8, 20, "Prateleira B1"],
    ["Bombom de morango", "Bombons", 64, 20, "Prateleira B2"],
    ["Chocolate em pó 200 g", "Cacau", 0, 10, "Armário C"],
    ["Cobertura fracionada", "Insumos", 15, 12, "Armário C"],
    ["Ovo de Páscoa 250 g", "Sazonais", 40, 15, "Depósito"],
];

// ---------- Utilidades ----------
function esc(texto) {
    const d = document.createElement("div");
    d.textContent = texto;
    return d.innerHTML;
}

function situacao(p) {
    if (p.quantidade === 0) return "zerado";
    if (p.quantidade <= p.estoque_minimo) return "baixo";
    return "ok";
}

function pecasCheias(p) {
    const alvo = Math.max(p.estoque_minimo * FATOR_CHEIO, 1);
    const n = Math.round((p.quantidade / alvo) * PECAS);
    // se tem estoque, mostra pelo menos 1 peça; se zerou, nenhuma
    return Math.min(PECAS, Math.max(p.quantidade > 0 ? 1 : 0, n));
}

function textoSituacao(p) {
    const st = situacao(p);
    if (st === "zerado") return "Em falta";
    if (st === "baixo")  return `Repor, mínimo ${p.estoque_minimo}`;
    return "Em dia";
}

const norm = (t) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const plural = (n, s, p) => `${n} ${n === 1 ? s : p}`;

// ---------- Avisos ----------
function aviso(msg, tipo = "ok") {
    const el = document.createElement("div");
    el.className = "toast" + (tipo === "erro" ? " toast--erro" : "");
    el.textContent = msg;
    $("toasts").appendChild(el);
    setTimeout(() => { el.classList.add("saindo"); setTimeout(() => el.remove(), 300); }, 3500);
}

// ---------- Requisições ----------
async function requisitar(url, opcoes = {}) {
    let resp;
    try {
        resp = await fetch(url, { headers: { "Content-Type": "application/json" }, ...opcoes });
    } catch {
        throw { conexao: true, erro: "Sem conexão com o servidor." };
    }
    const dados = await resp.json().catch(() => ({}));
    if (!resp.ok) throw dados;
    return dados;
}

async function carregar() {
    try {
        produtos = await requisitar(API);
        falhaConexao = false;
    } catch (e) {
        falhaConexao = !!e.conexao;
        if (!e.conexao) aviso(e.erro || "Erro ao carregar os produtos.", "erro");
    }
    atualizarCategorias();
    renderizar();
}

// ---------- Filtro, busca, ordenação ----------
function visiveis() {
    const termo = norm($("busca").value.trim());
    const res = produtos.filter((p) =>
        (filtro === "todos" || situacao(p) === filtro) &&
        (!termo || norm(`${p.nome} ${p.categoria} ${p.localizacao}`).includes(termo))
    );

    const modo = $("ordenar").value;
    const peso = { zerado: 0, baixo: 1, ok: 2 };
    const razao = (p) => p.quantidade / Math.max(p.estoque_minimo, 1);

    res.sort((a, b) => {
        if (modo === "urgencia") {
            return peso[situacao(a)] - peso[situacao(b)] || razao(a) - razao(b) || a.nome.localeCompare(b.nome, "pt-BR");
        }
        if (modo === "quantidade") return a.quantidade - b.quantidade;
        return a[modo].localeCompare(b[modo], "pt-BR") || a.nome.localeCompare(b.nome, "pt-BR");
    });
    return res;
}

// ---------- Renderização ----------
function manchete() {
    const falta = produtos.filter((p) => situacao(p) === "zerado").length;
    const repor = produtos.filter((p) => situacao(p) === "baixo").length;
    const unidades = produtos.reduce((s, p) => s + p.quantidade, 0);

    if (falhaConexao) {
        $("manchete").textContent = "Não consegui abrir o estoque.";
        $("subtotal").textContent = "";
        return;
    }
    if (!produtos.length) {
        $("manchete").textContent = "Seu estoque está vazio.";
        $("subtotal").textContent = "Cadastre o primeiro produto para começar a acompanhar.";
        return;
    }

    let titulo;
    if (falta && repor) titulo = `${plural(falta, "produto em falta", "produtos em falta")} e ${repor} para repor.`;
    else if (falta)     titulo = `${plural(falta, "produto em falta", "produtos em falta")}.`;
    else if (repor)     titulo = `${plural(repor, "produto precisa", "produtos precisam")} de reposição.`;
    else                titulo = "Tudo em dia no estoque.";

    $("manchete").textContent = titulo;
    $("subtotal").textContent = `${plural(produtos.length, "produto cadastrado", "produtos cadastrados")}, ${plural(unidades, "unidade", "unidades")} no total.`;
}

function renderizar() {
    manchete();

    const cont = { todos: produtos.length, zerado: 0, baixo: 0, ok: 0 };
    produtos.forEach((p) => cont[situacao(p)]++);
    $("nTodos").textContent = cont.todos;
    $("nZerado").textContent = cont.zerado;
    $("nBaixo").textContent = cont.baixo;
    $("nOk").textContent = cont.ok;

    const res = visiveis();
    lista.innerHTML = "";

    const semDados = falhaConexao || produtos.length === 0;
    const semResultado = !semDados && res.length === 0;
    $("vazio").hidden = !(semDados || semResultado);
    document.querySelector(".barra").hidden = semDados;

    if (semDados) montarVazio(falhaConexao ? "erro" : "novo");
    else if (semResultado) montarVazio("busca");

    res.forEach((p) => {
        const st = situacao(p);
        const cheias = pecasCheias(p);
        const li = document.createElement("li");
        li.className = "item" + (p.id === idRecemSalvo ? " novo" : "");

        const pecas = Array.from({ length: PECAS }, (_, i) => `<i class="${i < cheias ? "on" : ""}"></i>`).join("");

        li.innerHTML = `
            <div class="item__info">
                <div class="item__nome">${esc(p.nome)}</div>
                <div class="item__meta">
                    <span>${esc(p.categoria)}</span>
                    <span>
                        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M6 11s4-3.4 4-6.3A4 4 0 0 0 2 4.7C2 7.600 6 11 6 11z" fill="none" stroke="currentColor" stroke-width="1.3"/><circle cx="6" cy="4.700" r="1.300" fill="currentColor"/></svg>
                        ${esc(p.localizacao)}
                    </span>
                </div>
            </div>
            <div class="item__estoque">
                <div class="tablete tablete--${st}" role="img" aria-label="${cheias} de ${PECAS} quadradinhos preenchidos">${pecas}</div>
                <small class="${st}">${textoSituacao(p)}</small>
            </div>
            <div class="qtd">
                <button type="button" data-menos aria-label="Tirar 1 unidade de ${esc(p.nome)}" ${p.quantidade === 0 ? "disabled" : ""}>
                    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 7h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                </button>
                <span class="qtd__valor" aria-label="${p.quantidade} unidades">${p.quantidade}</span>
                <button type="button" data-mais aria-label="Adicionar 1 unidade de ${esc(p.nome)}">
                    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M7 2v10M2 7h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                </button>
            </div>
            <div class="acoes">
                <button type="button" class="btn-icone" data-editar aria-label="Editar ${esc(p.nome)}" title="Editar">
                    <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true"><path d="M3 17l1-4L14.500 2.500l3 3L7 16z" fill="none" stroke="currentColor" stroke-width="1.700" stroke-linejoin="round"/></svg>
                </button>
                <button type="button" class="btn-icone perigo" data-excluir aria-label="Excluir ${esc(p.nome)}" title="Excluir">
                    <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 6h12M8 6V3h4v3M6 6l1 11h6l1-11" fill="none" stroke="currentColor" stroke-width="1.700" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
            </div>`;

        li.querySelector("[data-mais]").onclick = () => ajustar(p.id, +1);
        li.querySelector("[data-menos]").onclick = () => ajustar(p.id, -1);
        li.querySelector("[data-editar]").onclick = () => abrirFormulario(p);
        li.querySelector("[data-excluir]").onclick = () => pedirExclusao(p);
        lista.appendChild(li);
    });
    idRecemSalvo = null;

    $("contagem").textContent = semDados ? "" : `Mostrando ${res.length} de ${produtos.length}.`;
}

function montarVazio(tipo) {
    const acoes = $("vazioAcoes");
    acoes.innerHTML = "";
    const botao = (txt, fn, sec) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "btn" + (sec ? " btn--sec" : ""); b.textContent = txt; b.onclick = fn;
        acoes.appendChild(b);
    };

    if (tipo === "novo") {
        $("vazioTitulo").textContent = "Nenhum produto por aqui";
        $("vazioTexto").textContent = "Cadastre um produto ou carregue alguns exemplos para ver como o estoque funciona.";
        botao("Cadastrar produto", () => abrirFormulario());
        botao("Carregar exemplos", carregarExemplos, true);
    } else if (tipo === "erro") {
        $("vazioTitulo").textContent = "Servidor desligado";
        $("vazioTexto").textContent = "Rode python app.py no terminal e abra http://127.0.0.1:5000 no navegador.";
        botao("Tentar de novo", carregar);
    } else {
        $("vazioTitulo").textContent = "Nada encontrado";
        $("vazioTexto").textContent = "Nenhum produto combina com a busca e o filtro atuais.";
        botao("Limpar busca e filtros", () => {
            $("busca").value = ""; definirFiltro("todos");
        }, true);
    }
}

async function carregarExemplos() {
    try {
        for (const [nome, categoria, quantidade, estoque_minimo, localizacao] of EXEMPLOS) {
            await requisitar(API, { method: "POST", body: JSON.stringify({ nome, categoria, quantidade, estoque_minimo, localizacao }) });
        }
        aviso("Exemplos carregados.");
        carregar();
    } catch (e) {
        aviso(e.erro || "Não foi possível carregar os exemplos.", "erro");
    }
}

function atualizarCategorias() {
    const cats = [...new Set(produtos.map((p) => p.categoria))].sort((a, b) => a.localeCompare(b, "pt-BR"));
    $("listaCategorias").innerHTML = cats.map((c) => `<option value="${esc(c)}">`).join("");
}

// ---------- Controles ----------
function definirFiltro(valor) {
    filtro = valor;
    document.querySelectorAll("#filtros button").forEach((b) =>
        b.setAttribute("aria-pressed", String(b.dataset.filtro === valor)));
    renderizar();
}
document.querySelectorAll("#filtros button").forEach((b) => b.onclick = () => definirFiltro(b.dataset.filtro));
$("busca").addEventListener("input", renderizar);
$("ordenar").addEventListener("change", renderizar);
$("btnNovo").onclick = () => abrirFormulario();

// ---------- Ajuste rápido ----------
async function ajustar(id, delta) {
    try {
        const novo = await requisitar(`${API}/${id}/quantidade`, { method: "PATCH", body: JSON.stringify({ delta }) });
        const i = produtos.findIndex((p) => p.id === id);
        produtos[i] = novo;
        renderizar();
        if (delta < 0 && situacao(novo) === "zerado") aviso(`${novo.nome} acabou.`, "erro");
        else if (delta < 0 && situacao(novo) === "baixo" && novo.quantidade === novo.estoque_minimo)
            aviso(`${novo.nome} chegou no estoque mínimo.`);
    } catch (e) {
        aviso(e.erro || "Não foi possível alterar a quantidade.", "erro");
    }
}

// ---------- Formulário ----------
function limparErros() {
    campos.forEach((c) => {
        $(c).closest(".campo").classList.remove("invalido");
        $(c).removeAttribute("aria-invalid");
        $(`erro-${c}`).textContent = "";
    });
}
function mostrarErro(c, msg) {
    $(c).closest(".campo").classList.add("invalido");
    $(c).setAttribute("aria-invalid", "true");
    $(`erro-${c}`).textContent = msg;
}

function abrirFormulario(p = null) {
    formulario.reset();
    limparErros();
    $("produtoId").value = p ? p.id : "";
    $("modalTitulo").textContent = p ? "Editar produto" : "Novo produto";
    $("btnSalvar").textContent = p ? "Salvar alterações" : "Cadastrar produto";
    if (p) campos.forEach((c) => ($(c).value = p[c]));
    modalForm.showModal();
    $("nome").focus();
}

document.querySelectorAll("[data-fechar]").forEach((b) => b.onclick = () => b.closest("dialog").close());
[modalForm, modalExcluir].forEach((m) => m.addEventListener("click", (e) => { if (e.target === m) m.close(); }));

campos.forEach((c) => $(c).addEventListener("input", () => {
    $(c).closest(".campo").classList.remove("invalido");
    $(c).removeAttribute("aria-invalid");
    $(`erro-${c}`).textContent = "";
}));

function validar(d) {
    limparErros();
    let ok = true;
    ["nome", "categoria", "localizacao"].forEach((c) => { if (!d[c]) { mostrarErro(c, "Preencha este campo."); ok = false; } });
    [["quantidade", "A quantidade"], ["estoque_minimo", "O estoque mínimo"]].forEach(([c, r]) => {
        if ($(c).value.trim() === "" || !Number.isInteger(d[c])) { mostrarErro(c, `${r} precisa ser um número inteiro.`); ok = false; }
        else if (d[c] < 0) { mostrarErro(c, `${r} não pode ser negativo.`); ok = false; }
    });
    if (!ok) $(campos.find((c) => $(c).getAttribute("aria-invalid"))).focus();
    return ok;
}

formulario.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const id = $("produtoId").value;
    const dados = {
        nome: $("nome").value.trim(),
        categoria: $("categoria").value.trim(),
        quantidade: Number($("quantidade").value),
        estoque_minimo: Number($("estoque_minimo").value),
        localizacao: $("localizacao").value.trim(),
    };
    if (!validar(dados)) return;

    const btn = $("btnSalvar"), original = btn.textContent;
    btn.disabled = true; btn.textContent = "Salvando…";
    try {
        const r = await requisitar(id ? `${API}/${id}` : API, { method: id ? "PUT" : "POST", body: JSON.stringify(dados) });
        idRecemSalvo = id ? Number(id) : r.id;
        modalForm.close();
        aviso(id ? "Alterações salvas." : "Produto cadastrado.");
        await carregar();
    } catch (e) {
        if (e.campos) Object.entries(e.campos).forEach(([c, m]) => campos.includes(c) && mostrarErro(c, m));
        else aviso(e.erro || "Não foi possível salvar o produto.", "erro");
    } finally {
        btn.disabled = false; btn.textContent = original;
    }
});

// ---------- Exclusão ----------
function pedirExclusao(p) {
    idParaExcluir = p.id;
    $("excluirNome").textContent = p.nome;
    modalExcluir.showModal();
}
$("btnConfirmarExcluir").onclick = async () => {
    try {
        await requisitar(`${API}/${idParaExcluir}`, { method: "DELETE" });
        modalExcluir.close();
        aviso("Produto excluído.");
        await carregar();
    } catch (e) {
        modalExcluir.close();
        aviso(e.erro || "Não foi possível excluir o produto.", "erro");
    }
};

carregar();
