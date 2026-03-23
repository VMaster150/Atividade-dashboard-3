// Dados e configurações
let transacoes = JSON.parse(localStorage.getItem('transacoes')) || [];
let categorias = JSON.parse(localStorage.getItem('categorias')) || [
  "Alimentação",
  "Transporte",
  "Moradia",
  "Lazer",
  "Saúde",
  "Educação",
  "Receita (Salário)",
  "Receita (Outros)"
];

// Gráfico do Controle
let chartControle;

const form = document.getElementById('formTransacao');
const tabelaBody = document.querySelector('#tabelaTransacoes tbody');
const saldoEl = document.getElementById('saldoAtual');
const totalDepositosEl = document.getElementById('totaldedepositos');
const totalDespesasEl = document.getElementById('totaldedespesas');
const selectCat = document.getElementById('categoria');
const alertaOrcamento = document.getElementById('alerta-orcamento');

let chartCategorias;

function salvarDados() {
  localStorage.setItem('transacoes', JSON.stringify(transacoes));
  localStorage.setItem('categorias', JSON.stringify(categorias));
}

function formatarMoeda(valor) {
  return 'R$ ' + Number(valor).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2});
}

function calcularSaldo() {
  let total = 0;
  transacoes.forEach(t => {
    total += t.tipo === 'depósito' ? t.valor : -t.valor;
  });
  saldoEl.textContent = formatarMoeda(total);
  saldoEl.className = total >= 0 ? 'positivo' : 'negativo';
}

function calcularTotalDepositos() {
  let totalDepositos = 0;
  transacoes.forEach(t => {
    totalDepositos += t.tipo === 'depósito' ? t.valor : 0;
  });
  totalDepositosEl.textContent = formatarMoeda(totalDepositos); 
}

function calcularTotalDespesas() {
  let totalDespesas = 0;
  transacoes.forEach(t => {
    totalDespesas += t.tipo === 'despesa' ? t.valor : 0;
  });
  totalDespesasEl.textContent = formatarMoeda(totalDespesas);
}


function popularSelectCategorias() {
  selectCat.innerHTML = '<option value=""> Sem categoria (apenas depósitos)</option>';
  categorias.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    selectCat.appendChild(opt);
  });

  const optNovaCat = document.createElement('option');
  optNovaCat.value = "Criar Nova Categoria";
  optNovaCat.textContent = "+ Nova Categoria";
  selectCat.appendChild(optNovaCat);
}

selectCat.addEventListener('change', adicionarCategoriaPersonalizavel);

function renderizarCategorias() {
  const lista = document.getElementById('categorias-lista');
  select.innerHTML = '';

  categorias.forEach((cat, index) => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  });
}

function adicionarCategoriaPersonalizavel() {
  if(this.value === "Criar Nova Categoria") {
    const novaCat = prompt("Digite o nome da nova categoria:");
    if(novaCat && novaCat.trim() !== ""){
      
      const nomeLimpo = novaCat.trim();
      if (!categorias.includes(nomeLimpo)) {
        categorias = categorias.filter(c => c !== "Adicionar Nova Categoria");
        categorias.push(nomeLimpo);
        salvarDados();
        popularSelectCategorias();
        renderizarCategorias();
        selectCat.value = nomeLimpo;
        alert(`Categoria "${nomeLimpo}" adicionada com sucesso!`);
      } else {
        alert('Categoria já existe!');
        this.value = "";
    } 
  } else {
        this.value = "";
      }
    }
  }

function removerCategoriaPersonalizavel() {
  
}

// Despesas por Categoria
function atualizarGraficoDespesas() {
  const despesasPorCat = {};

  transacoes
    .filter(t => t.tipo === 'despesa')
    .forEach(t => {   
      despesasPorCat[t.categoria] = (despesasPorCat[t.categoria] || 0) + t.valor;
    });

  const labels = Object.keys(despesasPorCat);
  const valores = Object.values(despesasPorCat);

  if (chartCategorias) chartCategorias.destroy();

  const ctx = document.getElementById('graficoCategorias');

  chartCategorias = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        label: 'Despesas por Categoria',
        data: valores,
        backgroundColor: ['#e74c3c','#3498db','#f39c12','#2ecc71','#9b59b6','#1abc9c','#34495e'],
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom'},
        title: {
          display: true,
          text: 'Despesas por Categoria'
        }
      }
    }
  });
}

// ! Controle
function atualizarGraficoControle() {

  let controle = {};

  transacoes.forEach(t => {

    if (!t.categoria) {
      return;
    }

    if (!controle[t.categoria]) {
      controle[t.categoria] = 0;
    }

    if (t.tipo === "depósito") {
      controle[t.categoria] += t.valor;
    }

    if (t.tipo === "despesa") {
      controle[t.categoria] -= t.valor;
    }
  });
  
  const labels = Object.keys(controle);
  const valores = Object.values(controle);

  if (chartControle) {
    chartControle.destroy();
  }

  chartControle = new Chart(document.getElementById("graficoControle"), {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [{
        label: "Controle por Categoria",
        data: valores
      }]
    },
    options: {
      responsive: true
    }
  });
}

function listarTransacoes() {
  tabelaBody.innerHTML = '';

  const tipoFiltro = document.getElementById('filtroTipo').value;

  let filtradas = transacoes;

  if (tipoFiltro) {
    filtradas = filtradas.filter(t => t.tipo === tipoFiltro);
  }

  const ordenadas = [...filtradas].sort((a,b) => new Date(b.data) - new Date(a.data));

  ordenadas.forEach((trans) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${new Date(trans.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
      <td>${trans.tipo}</td>
      <td>${trans.categoria || '-'}</td>
      <td>${trans.descricao || '-'}</td>
      <td class="${trans.tipo === 'depósito' ? 'positivo' : 'negativo'}">
        ${formatarMoeda(trans.valor)}
      </td>
      <td>
        <button onclick="editarTransacao(${trans.id})">Editar</button>
        <button class="btn-delete" onclick="removerTransacao(${trans.id})">Excluir</button>
      </td>
    `;
    tabelaBody.appendChild(tr);
  });
}

function editarTransacao(id) {
  const trans = transacoes.find(t => t.id === id);

  const novoValor = prompt("Novo valor:", trans.valor);
  if (novoValor === null) {
    return;
  }

  const novaDescricao = prompt("Nova descrição:", trans.descricao);
  if (novaDescricao === null) {
    return;
  }

  trans.valor = Number(novoValor);
  trans.descricao = novaDescricao;

  salvarDados();
  atualizarTudo();
}

function removerTransacao(id) {
  if (!confirm('Deseja realmente excluir esta transação?')) return;
  transacoes = transacoes.filter(t => t.id !== id);

  salvarDados();
  atualizarTudo();
}

function atualizarTudo() {
  listarTransacoes();
  calcularSaldo();
  calcularTotalDepositos();
  calcularTotalDespesas();
  atualizarGraficoDespesas();
  atualizarGraficoControle();
  renderizarCategorias();
}

form.addEventListener('submit', e => {
  e.preventDefault();

  const tipoSelecionado = document.getElementById('tipo').value
  const categoriaSelecionada = document.getElementById('categoria').value

  if (tipoSelecionado === 'despesa' && !categoriaSelecionada) {
    alert('Para despesas é necessário selecionar uma categoria!');
    return;
  }

  const novaTrans = {
    id: Date.now(),
    data: document.getElementById('data').value,
    tipo: tipoSelecionado,
    valor: Number(document.getElementById('valor').value),
    categoria: categoriaSelecionada || null,
    descricao: document.getElementById('descricao').value.trim()
  };

  transacoes.push(novaTrans);
  salvarDados();
  form.reset();
  atualizarTudo();
});

popularSelectCategorias();
atualizarTudo();

document.getElementById('filtroTipo').addEventListener('change', atualizarTudo)