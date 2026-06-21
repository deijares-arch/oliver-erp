import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useBarbearia } from '@/contexts/BarbeariaContext';
import {
  CalendarClock,
  Clock,
  DollarSign,
  Edit2,
  Plus,
  Save,
  Scissors,
  Target,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const dias = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'] as const;
type DiaSemana = (typeof dias)[number];

export default function Profissionais() {
  const {
    profissionais,
    agendamentos,
    horariosTrabalho,
    salvarHorarioTrabalho,
    adicionarProfissional,
    atualizarProfissional,
    deletarProfissional,
  } = useBarbearia();

  const [aba, setAba] = useState<'dados' | 'horarios'>('dados');
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [profissionalSelecionadoId, setProfissionalSelecionadoId] = useState('');
  const [despesasComissao, setDespesasComissao] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    nome: '',
    funcao: 'Profissional',
    comissao: 40,
    intervaloAgenda: 30,
    metaMensal: 0,
    especialidades: '',
  });

  const profissionaisAtivos = profissionais.filter((p: any) => p.ativo ?? true);

  useEffect(() => {
    if (!profissionalSelecionadoId && profissionaisAtivos[0]?.id) {
      setProfissionalSelecionadoId(profissionaisAtivos[0].id);
    }
  }, [profissionalSelecionadoId, profissionaisAtivos]);

  useEffect(() => {
    fetch('/api/despesas')
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => setDespesasComissao((json?.data || []).filter((d: any) => d.categoria === 'Comissão')))
      .catch(() => setDespesasComissao([]));
  }, []);

  const profissionalSelecionado = useMemo(
    () => profissionaisAtivos.find((p: any) => p.id === profissionalSelecionadoId),
    [profissionaisAtivos, profissionalSelecionadoId]
  );

  const moeda = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

  const metaGeralEquipe = profissionais.reduce(
    (soma: number, p: any) => soma + Number(p.metaMensal || 0),
    0
  );

  const faturamentoGeralEquipe = profissionais.reduce((soma: number, p: any) => {
    const lista = agendamentos.filter(
      (a: any) => a.profissionalId === p.id && !['Cancelado', 'Faltou'].includes(a.status)
    );
    return soma + lista.reduce((total: number, a: any) => total + Number(a.valor || 0), 0);
  }, 0);

  const percentualMetaGeral = metaGeralEquipe
    ? Math.min(100, Math.round((faturamentoGeralEquipe / metaGeralEquipe) * 100))
    : 0;

  const abrir = (id?: string) => {
    const p = id ? profissionais.find((x: any) => x.id === id) : undefined;

    if (p) {
      setFormData({
        nome: p.nome,
        funcao: p.funcao || 'Profissional',
        comissao: Number(p.comissao || 0),
        intervaloAgenda: Number(p.intervaloAgenda || p.intervalo_agenda || 30),
        metaMensal: Number(p.metaMensal || 0),
        especialidades: p.especialidades || '',
      });
      setEditando(id || null);
    } else {
      setFormData({
        nome: '',
        funcao: 'Profissional',
        comissao: 40,
        intervaloAgenda: 30,
        metaMensal: 0,
        especialidades: '',
      });
      setEditando(null);
    }

    setModalAberto(true);
  };

  const salvar = () => {
    if (!formData.nome.trim()) {
      alert('Informe o nome do profissional.');
      return;
    }

    if (editando) {
      atualizarProfissional(editando, { ...formData, ativo: true });
    } else {
      adicionarProfissional({ ...formData, ativo: true });
    }

    setModalAberto(false);
  };

  const stats = (id: string, comissao: number) => {
    const lista = agendamentos.filter(
      (a: any) => a.profissionalId === id && !['Cancelado', 'Faltou'].includes(a.status)
    );
    const faturamento = lista.reduce((soma: number, a: any) => soma + Number(a.valor || 0), 0);

    return {
      atendimentos: lista.length,
      faturamento,
      comissaoValor: faturamento * (Number(comissao || 0) / 100),
    };
  };

  const resumoComissaoProfissional = (nome: string) => {
    const lista = despesasComissao.filter((d: any) => String(d.fornecedor || '').trim() === String(nome || '').trim());
    return {
      pendente: lista.filter((d: any) => d.status !== 'Pago').reduce((soma: number, d: any) => soma + Number(d.valor || 0), 0),
      pago: lista.filter((d: any) => d.status === 'Pago').reduce((soma: number, d: any) => soma + Number(d.valor || 0), 0),
    };
  };

  const regraDoDia = (diaSemana: DiaSemana) =>
    (horariosTrabalho || []).find(
      (h: any) => String(h.profissionalId) === String(profissionalSelecionadoId) && h.diaSemana === diaSemana
    ) || {
      profissionalId: profissionalSelecionadoId,
      diaSemana,
      ativo: diaSemana !== 'Domingo',
      inicio: '08:00',
      fim: diaSemana === 'Sábado' ? '13:00' : '18:00',
      intervaloInicio: diaSemana === 'Sábado' || diaSemana === 'Domingo' ? '' : '12:00',
      intervaloFim: diaSemana === 'Sábado' || diaSemana === 'Domingo' ? '' : '13:30',
    };

  const salvarCampoHorario = async (diaSemana: DiaSemana, campo: string, valor: string | boolean) => {
    if (!profissionalSelecionadoId) return;

    const regra = regraDoDia(diaSemana);

    await salvarHorarioTrabalho({
      ...regra,
      profissionalId: profissionalSelecionadoId,
      diaSemana,
      [campo]: valor,
    });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 md:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Profissionais</h1>
              <p className="text-muted-foreground">
                Cadastro, comissão, metas e horários de trabalho em uma única tela.
              </p>
            </div>

            <Button onClick={() => abrir()} className="btn-premium gap-2">
              <Plus className="h-4 w-4" />
              Novo Profissional
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={aba === 'dados' ? 'default' : 'outline'}
              className={aba === 'dados' ? 'btn-premium' : ''}
              onClick={() => setAba('dados')}
            >
              Dados do Profissional
            </Button>

            <Button
              type="button"
              variant={aba === 'horarios' ? 'default' : 'outline'}
              className={aba === 'horarios' ? 'btn-premium gap-2' : 'gap-2'}
              onClick={() => setAba('horarios')}
            >
              <CalendarClock className="h-4 w-4" />
              Horários de Trabalho
            </Button>
          </div>
        </div>
      </div>

      {aba === 'dados' && (
        <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
          <div className="mb-5 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 to-primary/5 p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold">Meta Geral da Equipe</h2>
                <p className="text-sm text-muted-foreground">
                  Acompanhamento consolidado das metas mensais dos profissionais.
                </p>
              </div>

              <div className="text-left md:text-right">
                <p className="text-3xl font-black text-primary">{percentualMetaGeral}%</p>
                <p className="text-sm text-muted-foreground">
                  {moeda(faturamentoGeralEquipe)} / {moeda(metaGeralEquipe)}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex justify-between text-xs text-muted-foreground">
                <span>Realizado</span>
                <span>Meta mensal da equipe</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${percentualMetaGeral}%` }}
                />
              </div>
            </div>

            {metaGeralEquipe === 0 && (
              <p className="mt-3 text-sm text-muted-foreground">
                Cadastre a meta mensal dos profissionais para acompanhar o desempenho da equipe.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {profissionais.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
              Nenhum profissional cadastrado.
            </div>
          ) : (
            profissionais.map((p: any) => {
              const s = stats(p.id, Number(p.comissao || 0));
              const meta = Number(p.metaMensal || 0);
              const pct = meta ? Math.min(100, Math.round((s.faturamento / meta) * 100)) : 0;
              const resumoComissao = resumoComissaoProfissional(p.nome);

              return (
                <div key={p.id} className="card-premium">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/15 text-primary">
                        <Scissors className="h-7 w-7" />
                      </div>

                      <div>
                        <h3 className="text-xl font-semibold">{p.nome}</h3>
                        <p className="text-sm text-muted-foreground">
                          {p.funcao || 'Profissional'} • {p.comissao || 0}% comissão • agenda {p.intervaloAgenda || 30} min
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="icon" variant="outline" onClick={() => abrir(p.id)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>

                      <Button
                        size="icon"
                        variant="outline"
                        className="text-destructive"
                        onClick={() => confirm('Excluir profissional?') && deletarProfissional(p.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {p.especialidades && (
                    <p className="mt-4 text-sm text-muted-foreground">{p.especialidades}</p>
                  )}

                  <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                    <div className="rounded-lg bg-secondary/60 p-3">
                      <TrendingUp className="mb-1 h-4 w-4 text-primary" />
                      {s.atendimentos}
                      <br />
                      <span className="text-muted-foreground">Atend.</span>
                    </div>

                    <div className="rounded-lg bg-secondary/60 p-3">
                      <DollarSign className="mb-1 h-4 w-4 text-primary" />
                      {moeda(s.faturamento)}
                      <br />
                      <span className="text-muted-foreground">Faturado</span>
                    </div>

                    <div className="rounded-lg bg-secondary/60 p-3">
                      <Target className="mb-1 h-4 w-4 text-primary" />
                      {moeda(s.comissaoValor)}
                      <br />
                      <span className="text-muted-foreground">Comissão</span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                      <p className="text-xs text-muted-foreground">Comissão pendente</p>
                      <p className="font-black text-amber-400">{moeda(resumoComissao.pendente)}</p>
                    </div>
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                      <p className="text-xs text-muted-foreground">Comissão paga</p>
                      <p className="font-black text-emerald-400">{moeda(resumoComissao.pago)}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                      <span>Meta mensal</span>
                      <span>
                        {meta > 0 ? `${pct}% de ${moeda(meta)}` : 'Sem meta cadastrada'}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="mt-5 w-full"
                    onClick={() => {
                      setProfissionalSelecionadoId(p.id);
                      setAba('horarios');
                    }}
                  >
                    Configurar horários
                  </Button>
                </div>
              );
            })
          )}
          </div>
        </div>
      )}

      {aba === 'horarios' && (
        <div className="mx-auto max-w-6xl space-y-5 px-4 py-8 md:px-8">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <Clock className="h-6 w-6" />
                </div>

                <div>
                  <h2 className="text-xl font-bold">
                    {profissionalSelecionado?.nome || 'Selecione um profissional'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    A agenda só aceitará agendamento dentro destes horários.
                  </p>
                </div>
              </div>

              <div className="w-full md:w-80">
                <Label>Profissional</Label>
                <Select
                  value={profissionalSelecionadoId ? String(profissionalSelecionadoId) : undefined}
                  onValueChange={setProfissionalSelecionadoId}
                >
                  <SelectTrigger className="rounded-xl border-border bg-card">
                    <SelectValue placeholder="Selecione o profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    {profissionaisAtivos.map((p: any) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {!profissionalSelecionadoId ? (
            <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
              Cadastre ou selecione um profissional para configurar os horários.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {dias.map((dia) => {
                const regra = regraDoDia(dia);

                return (
                  <div key={dia} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <div className="grid grid-cols-1 items-center gap-4 lg:grid-cols-[220px_110px_1fr]">
                      <div>
                        <p className="text-lg font-bold">{dia}</p>
                        <p className="text-xs text-muted-foreground">
                          {regra.ativo ? 'Agenda liberada' : 'Dia bloqueado'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          checked={Boolean(regra.ativo)}
                          onCheckedChange={(v) => salvarCampoHorario(dia, 'ativo', v)}
                        />
                        <span className="text-sm">Ativo</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        <div>
                          <Label>Início</Label>
                          <Input
                            type="time"
                            value={regra.inicio || ''}
                            disabled={!regra.ativo}
                            onChange={(e) => salvarCampoHorario(dia, 'inicio', e.target.value)}
                          />
                        </div>

                        <div>
                          <Label>Fim</Label>
                          <Input
                            type="time"
                            value={regra.fim || ''}
                            disabled={!regra.ativo}
                            onChange={(e) => salvarCampoHorario(dia, 'fim', e.target.value)}
                          />
                        </div>

                        <div>
                          <Label>Intervalo início</Label>
                          <Input
                            type="time"
                            value={regra.intervaloInicio || ''}
                            disabled={!regra.ativo}
                            onChange={(e) =>
                              salvarCampoHorario(dia, 'intervaloInicio', e.target.value)
                            }
                          />
                        </div>

                        <div>
                          <Label>Intervalo fim</Label>
                          <Input
                            type="time"
                            value={regra.intervaloFim || ''}
                            disabled={!regra.ativo}
                            onChange={(e) =>
                              salvarCampoHorario(dia, 'intervaloFim', e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-start gap-2 rounded-2xl border border-primary/30 bg-primary/10 p-4 text-sm text-primary">
            <Save className="mt-0.5 h-5 w-5" />
            <p>As alterações são salvas automaticamente no banco. Não precisa clicar em botão.</p>
          </div>
        </div>
      )}

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="border-border bg-card">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar Profissional' : 'Novo Profissional'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="border-border bg-secondary"
              />
            </div>

            <div>
              <Label>Função</Label>
              <Input
                value={formData.funcao}
                onChange={(e) => setFormData({ ...formData, funcao: e.target.value })}
                className="border-border bg-secondary"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <Label>Comissão %</Label>
                <Input
                  type="number"
                  value={formData.comissao}
                  onChange={(e) => setFormData({ ...formData, comissao: Number(e.target.value) })}
                  className="border-border bg-secondary"
                />
              </div>

              <div>
                <Label>Intervalo da agenda</Label>
                <Select
                  value={String(formData.intervaloAgenda || 30)}
                  onValueChange={(value) =>
                    setFormData({ ...formData, intervaloAgenda: Number(value) })
                  }
                >
                  <SelectTrigger className="border-border bg-secondary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutos</SelectItem>
                    <SelectItem value="20">20 minutos</SelectItem>
                    <SelectItem value="25">25 minutos</SelectItem>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="35">35 minutos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Meta mensal R$</Label>
                <Input
                  type="number"
                  value={formData.metaMensal}
                  onChange={(e) =>
                    setFormData({ ...formData, metaMensal: Number(e.target.value) })
                  }
                  className="border-border bg-secondary"
                />
              </div>
            </div>

            <div>
              <Label>Especialidades</Label>
              <Textarea
                value={formData.especialidades}
                onChange={(e) => setFormData({ ...formData, especialidades: e.target.value })}
                className="border-border bg-secondary"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModalAberto(false)}>
                Cancelar
              </Button>
              <Button className="btn-premium" onClick={salvar}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
