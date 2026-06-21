import { useBarbearia } from '@/contexts/BarbeariaContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertCircle, ArrowDownCircle, DollarSign, Package, Scissors, TrendingUp, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { PageShell, SummaryCard } from '@/components/PageShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const moeda = (valor: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor || 0));

type Despesa = {
  id: string;
  descricao: string;
  categoria: string;
  valor: number;
  data: string;
  forma: string;
  fornecedor: string;
  status: 'Pendente' | 'Pago' | 'Vencido';
  observacao?: string;
};

type Movimento = {
  id: string;
  tipo: 'Entrada' | 'Saída';
  descricao: string;
  categoria: string;
  valor: number;
  data: string;
  forma: string;
  status: 'Pago' | 'Pendente';
};

async function api(path: string) {
  const response = await fetch(path, { headers: { 'Content-Type': 'application/json' } });
  const json = await response.json().catch(() => null);
  if (!response.ok || json?.ok === false) throw new Error(json?.error || 'Erro na API');
  return json?.data;
}

function dataParaISO(data: string) {
  if (!data) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(data)) return data;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(data)) {
    const [d, m, y] = data.split('/');
    return `${y}-${m}-${d}`;
  }
  return data.slice(0, 10);
}

function dataBR(data: string) {
  const iso = dataParaISO(data);
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function dentroPeriodo(data: string, inicio: string, fim: string) {
  const iso = dataParaISO(data);
  if (!iso) return true;
  if (inicio && iso < inicio) return false;
  if (fim && iso > fim) return false;
  return true;
}

function ehComissao(item: any) {
  return String(item?.categoria || item?.origem || item?.descricao || '')
    .toLowerCase()
    .includes('comiss');
}

function ehProduto(item: any) {
  return String(item?.categoria || item?.origem || item?.descricao || '')
    .toLowerCase()
    .includes('produto');
}

export default function Relatorios() {
  const { agendamentos, clientes, profissionais, servicos } = useBarbearia() as any;
  const hoje = new Date().toISOString().slice(0, 10);
  const primeiroDia = hoje.slice(0, 8) + '01';

  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [fluxo, setFluxo] = useState<Movimento[]>([]);
  const [filtros, setFiltros] = useState({
    inicio: primeiroDia,
    fim: hoje,
    profissionalId: 'todos',
    clienteId: 'todos',
    categoria: 'todas',
    status: 'todos',
  });

  useEffect(() => {
    Promise.all([api('/api/despesas').catch(() => []), api('/api/fluxo-caixa').catch(() => [])])
      .then(([d, f]) => {
        setDespesas(d || []);
        setFluxo(f || []);
      })
      .catch((e) => alert('Erro ao carregar relatórios: ' + e.message));
  }, []);

  const agendamentosFiltrados = useMemo(() => {
    return agendamentos.filter((a: any) => {
      if (!dentroPeriodo(a.data, filtros.inicio, filtros.fim)) return false;
      if (filtros.profissionalId !== 'todos' && String(a.profissionalId) !== filtros.profissionalId) return false;
      if (filtros.clienteId !== 'todos' && String(a.clienteId) !== filtros.clienteId) return false;
      if (filtros.status !== 'todos' && a.status !== filtros.status) return false;
      return true;
    });
  }, [agendamentos, filtros]);

  const despesasFiltradas = useMemo(() => {
    return despesas.filter((d) => {
      if (!dentroPeriodo(d.data, filtros.inicio, filtros.fim)) return false;
      if (filtros.categoria !== 'todas' && d.categoria !== filtros.categoria) return false;
      if (filtros.status !== 'todos' && d.status !== filtros.status) return false;
      if (filtros.profissionalId !== 'todos') {
        const prof = profissionais.find((p: any) => String(p.id) === filtros.profissionalId);
        if (prof && !`${d.descricao} ${d.fornecedor} ${d.observacao}`.toLowerCase().includes(String(prof.nome).toLowerCase())) return false;
      }
      return true;
    });
  }, [despesas, filtros, profissionais]);

  const fluxoFiltrado = useMemo(() => fluxo.filter((m) => dentroPeriodo(m.data, filtros.inicio, filtros.fim)), [fluxo, filtros]);

  const realizados = agendamentosFiltrados.filter((a: any) => ['Realizado', 'Finalizado'].includes(a.status));
  const receitaAgendamentos = realizados.reduce((s: number, a: any) => s + Number(a.valor || 0), 0);
  const entradasFluxo = fluxoFiltrado.filter((m) => m.tipo === 'Entrada' && m.status === 'Pago');
  const receitaProdutos = entradasFluxo.filter(ehProduto).reduce((s, m) => s + Number(m.valor || 0), 0);
  const receitaServicos = entradasFluxo.length
    ? entradasFluxo.filter((m) => !ehProduto(m)).reduce((s, m) => s + Number(m.valor || 0), 0)
    : receitaAgendamentos;

  const comissoesPagas = despesasFiltradas.filter((d) => d.status === 'Pago' && ehComissao(d)).reduce((s, d) => s + Number(d.valor || 0), 0);
  const comissoesPendentes = despesasFiltradas.filter((d) => d.status === 'Pendente' && ehComissao(d)).reduce((s, d) => s + Number(d.valor || 0), 0);
  const despesasGerais = despesasFiltradas.filter((d) => d.status === 'Pago' && !ehComissao(d)).reduce((s, d) => s + Number(d.valor || 0), 0);
  const lucroLiquido = receitaServicos + receitaProdutos - despesasGerais - comissoesPagas;

  const categorias = Array.from(new Set(despesas.map((d) => d.categoria).filter(Boolean)));

  const dadosPorServico = servicos
    .map((servico: any) => ({
      nome: servico.nome,
      valor: realizados.filter((a: any) => String(a.servicoId) === String(servico.id)).reduce((s: number, a: any) => s + Number(a.valor || 0), 0),
    }))
    .filter((x: any) => x.valor > 0);

  const relatorioComissoes = despesasFiltradas.filter(ehComissao);
  const relatorioDespesasGerais = despesasFiltradas.filter((d) => !ehComissao(d));

  const limparFiltros = () => setFiltros({ inicio: primeiroDia, fim: hoje, profissionalId: 'todos', clienteId: 'todos', categoria: 'todas', status: 'todos' });

  return (
    <PageShell title="Relatórios" subtitle="Atendimentos, produtos, despesas, comissões e fluxo de caixa com filtros.">
      <div className="space-y-5">
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <p className="mb-3 font-bold">Filtros</p>
          <div className="grid gap-3 md:grid-cols-6">
            <div>
              <Label>Data inicial</Label>
              <Input type="date" value={filtros.inicio} onChange={(e) => setFiltros({ ...filtros, inicio: e.target.value })} />
            </div>
            <div>
              <Label>Data final</Label>
              <Input type="date" value={filtros.fim} onChange={(e) => setFiltros({ ...filtros, fim: e.target.value })} />
            </div>
            <div>
              <Label>Profissional</Label>
              <select className="w-full rounded-xl border bg-background p-3" value={filtros.profissionalId} onChange={(e) => setFiltros({ ...filtros, profissionalId: e.target.value })}>
                <option value="todos">Todos</option>
                {profissionais.map((p: any) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
            <div>
              <Label>Cliente</Label>
              <select className="w-full rounded-xl border bg-background p-3" value={filtros.clienteId} onChange={(e) => setFiltros({ ...filtros, clienteId: e.target.value })}>
                <option value="todos">Todos</option>
                {clientes.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div>
              <Label>Categoria</Label>
              <select className="w-full rounded-xl border bg-background p-3" value={filtros.categoria} onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value })}>
                <option value="todas">Todas</option>
                {categorias.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label>Status</Label>
              <select className="w-full rounded-xl border bg-background p-3" value={filtros.status} onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}>
                <option value="todos">Todos</option>
                <option value="Realizado">Realizado</option>
                <option value="Confirmado">Confirmado</option>
                <option value="Agendado">Agendado</option>
                <option value="Pago">Pago</option>
                <option value="Pendente">Pendente</option>
                <option value="Vencido">Vencido</option>
              </select>
            </div>
          </div>
          <div className="mt-3 flex justify-end"><Button variant="outline" onClick={limparFiltros}>Limpar filtros</Button></div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
          <SummaryCard title="Receita serviços" value={moeda(receitaServicos)} icon={<Scissors className="h-5 w-5" />} tone="green" />
          <SummaryCard title="Receita produtos" value={moeda(receitaProdutos)} icon={<Package className="h-5 w-5" />} tone="blue" />
          <SummaryCard title="Despesas gerais" value={moeda(despesasGerais)} icon={<ArrowDownCircle className="h-5 w-5" />} tone="red" />
          <SummaryCard title="Comissões pagas" value={moeda(comissoesPagas)} icon={<Users className="h-5 w-5" />} tone="amber" />
          <SummaryCard title="Comissões pendentes" value={moeda(comissoesPendentes)} icon={<AlertCircle className="h-5 w-5" />} tone="amber" />
          <SummaryCard title="Lucro líquido" value={moeda(lucroLiquido)} icon={<TrendingUp className="h-5 w-5" />} tone="primary" />
        </div>

        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-bold">Receita por serviço</h2>
          {dadosPorServico.length ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosPorServico} margin={{ left: 0, right: 8, top: 8, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nome" angle={-25} textAnchor="end" height={70} interval={0} tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => moeda(Number(v))} />
                  <Bar dataKey="valor" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="py-8 text-center text-muted-foreground">Sem dados no período.</p>}
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-bold">Relatório de despesas gerais</h2>
            <div className="space-y-2">
              {relatorioDespesasGerais.map((d) => (
                <div key={d.id} className="rounded-xl border bg-secondary/40 p-3">
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="font-semibold">{d.descricao}</p>
                      <p className="text-xs text-muted-foreground">{dataBR(d.data)} • {d.categoria} • {d.status} • {d.forma}</p>
                    </div>
                    <p className="font-black text-red-500">{moeda(d.valor)}</p>
                  </div>
                </div>
              ))}
              {!relatorioDespesasGerais.length && <p className="py-8 text-center text-muted-foreground">Nenhuma despesa encontrada.</p>}
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-bold">Relatório de comissões</h2>
            <div className="space-y-2">
              {relatorioComissoes.map((d) => (
                <div key={d.id} className="rounded-xl border bg-secondary/40 p-3">
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="font-semibold">{d.descricao}</p>
                      <p className="text-xs text-muted-foreground">{dataBR(d.data)} • {d.status} • {d.forma} • {d.fornecedor || 'Profissional'}</p>
                    </div>
                    <p className="font-black text-amber-500">{moeda(d.valor)}</p>
                  </div>
                </div>
              ))}
              {!relatorioComissoes.length && <p className="py-8 text-center text-muted-foreground">Nenhuma comissão encontrada.</p>}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-bold">Fluxo de caixa no período</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <SummaryCard title="Entradas" value={moeda(fluxoFiltrado.filter((m) => m.tipo === 'Entrada').reduce((s, m) => s + Number(m.valor || 0), 0))} icon={<DollarSign className="h-5 w-5" />} tone="green" />
            <SummaryCard title="Saídas" value={moeda(fluxoFiltrado.filter((m) => m.tipo === 'Saída').reduce((s, m) => s + Number(m.valor || 0), 0))} icon={<ArrowDownCircle className="h-5 w-5" />} tone="red" />
            <SummaryCard title="Saldo" value={moeda(fluxoFiltrado.reduce((s, m) => s + (m.tipo === 'Entrada' ? Number(m.valor || 0) : -Number(m.valor || 0)), 0))} icon={<TrendingUp className="h-5 w-5" />} tone="primary" />
          </div>
        </div>
      </div>
    </PageShell>
  );
}
