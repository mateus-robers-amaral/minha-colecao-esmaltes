// ===== Minha Coleção de Esmaltes — design "Prateleira" =====
// Os esmaltes ficam salvos no próprio navegador (localStorage).

const CHAVE = 'esmaltes';
const DIAS_AVISO = 30; // a partir de quantos dias antes de vencer o esmalte fica "perto"

let esmaltes = carregar();
let filtro = null;      // null, 'ok', 'perto' ou 'vencido'
let editandoId = null;  // id do esmalte aberto na janela (null = novo)

// ---------- Salvar e carregar ----------
function carregar() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE)) || [];
  } catch (erro) {
    return [];
  }
}

function salvar() {
  localStorage.setItem(CHAVE, JSON.stringify(esmaltes));
}

// ---------- Datas ----------
// Converte "2026-10-06" em uma data local (sem problema de fuso horário)
function lerData(texto) {
  const [ano, mes, dia] = texto.split('-').map(Number);
  return new Date(ano, mes - 1, dia);
}

function paraTexto(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function hoje() {
  const agora = new Date();
  return new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
}

function diasAteVencer(esmalte) {
  const umDia = 24 * 60 * 60 * 1000;
  return Math.round((lerData(esmalte.validade) - hoje()) / umDia);
}

function status(esmalte) {
  const dias = diasAteVencer(esmalte);
  if (dias < 0) return 'vencido';
  if (dias <= DIAS_AVISO) return 'perto';
  return 'ok';
}

function textoEtiqueta(esmalte) {
  const dias = diasAteVencer(esmalte);
  if (dias < 0) return 'Vencido';
  if (dias === 0) return 'Vence hoje';
  if (dias === 1) return '1 dia';
  if (dias <= DIAS_AVISO) return `${dias} dias`;
  const v = lerData(esmalte.validade);
  return `${String(v.getMonth() + 1).padStart(2, '0')}/${v.getFullYear()}`;
}

// ---------- Desenhar a tela ----------
function desenhar() {
  const busca = document.getElementById('busca').value.trim().toLowerCase();

  // Ordena: os que vencem primeiro aparecem antes
  const ordenados = [...esmaltes].sort((a, b) => a.validade.localeCompare(b.validade));

  // Contagem para o resumo
  const contagem = { ok: 0, perto: 0, vencido: 0 };
  ordenados.forEach(e => contagem[status(e)]++);
  document.getElementById('qtdOk').textContent = contagem.ok;
  document.getElementById('qtdPerto').textContent = contagem.perto;
  document.getElementById('qtdVencido').textContent = contagem.vencido;
  document.getElementById('total').textContent =
    esmaltes.length === 1 ? '1 esmalte' : `${esmaltes.length} esmaltes`;

  desenharAviso(ordenados);

  // Cartões de filtro
  document.querySelectorAll('.cartao').forEach(cartao => {
    cartao.classList.toggle('ativo', cartao.dataset.filtro === filtro);
  });
  const filtroAtivo = document.getElementById('filtroAtivo');
  if (filtro) {
    const nomes = { ok: 'em dia', perto: 'vencem em 30 dias', vencido: 'vencidos' };
    filtroAtivo.innerHTML = `Mostrando só: <b>${nomes[filtro]}</b> · <button type="button">mostrar todos</button>`;
    filtroAtivo.querySelector('button').onclick = () => { filtro = null; desenhar(); };
    filtroAtivo.hidden = false;
  } else {
    filtroAtivo.hidden = true;
  }

  // Prateleira
  const visiveis = ordenados.filter(e =>
    (!filtro || status(e) === filtro) &&
    e.nome.toLowerCase().includes(busca)
  );

  const prateleira = document.getElementById('prateleira');
  prateleira.innerHTML = '';
  visiveis.forEach(e => prateleira.appendChild(criarVidrinho(e)));

  document.getElementById('vazio').hidden = esmaltes.length > 0;
}

function criarVidrinho(esmalte) {
  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = `esmalte ${status(esmalte)}`;
  botao.title = 'Clique para editar';

  const vidro = document.createElement('div');
  vidro.className = 'vidro';
  const tampa = document.createElement('div');
  tampa.className = 'tampa';
  const corpo = document.createElement('div');
  corpo.className = 'corpo';
  corpo.style.background = esmalte.cor;
  vidro.append(tampa, corpo);

  const nome = document.createElement('span');
  nome.className = 'nome';
  nome.textContent = esmalte.nome;

  const etiqueta = document.createElement('span');
  etiqueta.className = 'etiqueta';
  etiqueta.textContent = textoEtiqueta(esmalte);

  botao.append(vidro, nome, etiqueta);
  botao.onclick = () => abrirJanela(esmalte);
  return botao;
}

function desenharAviso(ordenados) {
  const aviso = document.getElementById('aviso');
  const perto = ordenados.filter(e => status(e) === 'perto');
  const vencidos = ordenados.filter(e => status(e) === 'vencido');

  if (perto.length === 0 && vencidos.length === 0) {
    aviso.hidden = true;
    return;
  }

  aviso.innerHTML = '';
  if (perto.length > 0) {
    const primeiro = perto[0];
    const linha = document.createElement('div');
    linha.append('Use logo: ');
    const destaque = document.createElement('strong');
    destaque.textContent = primeiro.nome;
    linha.append(destaque, ` vence em ${textoEtiqueta(primeiro)}.`);
    if (perto.length > 1) linha.append(` (+${perto.length - 1} perto de vencer)`);
    aviso.appendChild(linha);
  }
  if (vencidos.length > 0) {
    const linha = document.createElement('div');
    linha.textContent = vencidos.length === 1
      ? '1 esmalte está vencido e pode ser descartado.'
      : `${vencidos.length} esmaltes estão vencidos e podem ser descartados.`;
    aviso.appendChild(linha);
  }
  aviso.hidden = false;
}

// ---------- Janela de cadastro ----------
const janela = document.getElementById('janela');

function abrirJanela(esmalte) {
  editandoId = esmalte ? esmalte.id : null;
  document.getElementById('tituloJanela').textContent = esmalte ? 'Editar esmalte' : 'Novo esmalte';
  document.getElementById('campoNome').value = esmalte ? esmalte.nome : '';
  document.getElementById('campoCor').value = esmalte ? esmalte.cor : '#f2735a';
  document.getElementById('campoFabricacao').value = esmalte ? esmalte.fabricacao : '';
  document.getElementById('campoValidade').value = esmalte ? esmalte.validade : '';
  document.getElementById('campoMeses').value = 24;
  document.getElementById('btnExcluir').hidden = !esmalte;
  janela.showModal();
}

document.getElementById('formulario').addEventListener('submit', () => {
  const fabricacao = document.getElementById('campoFabricacao').value;
  let validade = document.getElementById('campoValidade').value;

  // Sem validade escrita? Calcula: fabricação + meses
  if (!validade) {
    const meses = Number(document.getElementById('campoMeses').value) || 24;
    const data = lerData(fabricacao);
    data.setMonth(data.getMonth() + meses);
    validade = paraTexto(data);
  }

  const dados = {
    nome: document.getElementById('campoNome').value.trim(),
    cor: document.getElementById('campoCor').value,
    fabricacao,
    validade
  };

  if (editandoId) {
    const esmalte = esmaltes.find(e => e.id === editandoId);
    Object.assign(esmalte, dados);
  } else {
    esmaltes.push({ id: Date.now().toString(), ...dados });
  }
  salvar();
  desenhar();
});

document.getElementById('btnCancelar').onclick = () => janela.close();

document.getElementById('btnExcluir').onclick = () => {
  if (!confirm('Descartar este esmalte da coleção?')) return;
  esmaltes = esmaltes.filter(e => e.id !== editandoId);
  salvar();
  janela.close();
  desenhar();
};

// ---------- Outros botões ----------
document.getElementById('btnNovo').onclick = () => abrirJanela(null);
document.getElementById('busca').oninput = desenhar;

document.querySelectorAll('.cartao').forEach(cartao => {
  cartao.onclick = () => {
    filtro = filtro === cartao.dataset.filtro ? null : cartao.dataset.filtro;
    desenhar();
  };
});

// Exemplos para testar o site (datas calculadas a partir de hoje)
document.getElementById('btnExemplos').onclick = () => {
  const daqui = (dias) => {
    const d = hoje();
    d.setDate(d.getDate() + dias);
    return paraTexto(d);
  };
  const exemplos = [
    ['Coral Verão', '#F2735A', 6],
    ['Nude Areia', '#D9B49A', -20],
    ['Vermelho Paixão', '#B3122E', 18],
    ['Lilás Nuvem', '#B9A3E3', 160],
    ['Azul Meia-Noite', '#1F2A5C', 300],
    ['Verde Menta', '#8FD3B6', 400],
    ['Rosa Chiclete', '#F48FB8', -60],
    ['Preto Básico', '#1A1A1A', 480],
    ['Glitter Dourado', '#D4A93C', 220]
  ];
  esmaltes = exemplos.map(([nome, cor, dias], i) => ({
    id: String(Date.now() + i),
    nome,
    cor,
    fabricacao: daqui(dias - 730),
    validade: daqui(dias)
  }));
  salvar();
  desenhar();
};

desenhar();
