
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight, Building2, CheckCircle2, Eye, EyeOff, Lock, Mail, Phone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type CadastroResultado = {
  empresaId: string;
  empresaNome: string;
  slug: string;
  linkAcesso: string;
  adminEmail: string;
  ativaAte: string;
};

function limparSlug(texto: string) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export default function CadastroEmpresa() {
  const [, navigate] = useLocation();
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState<CadastroResultado | null>(null);

  const [form, setForm] = useState({
    empresaNome: "",
    segmento: "Barbearia",
    documento: "",
    telefone: "",
    email: "",
    cidade: "",
    uf: "",
    responsavelNome: "",
    responsavelEmail: "",
    senha: "",
    confirmarSenha: "",
    aceitarTermos: false,
  });

  const slugPreview = useMemo(() => limparSlug(form.empresaNome), [form.empresaNome]);

  function atualizar(campo: string, valor: any) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();

    if (!form.empresaNome.trim()) return toast.error("Informe o nome da empresa.");
    if (!form.responsavelNome.trim()) return toast.error("Informe o nome do responsável.");
    if (!form.telefone.trim()) return toast.error("Informe o WhatsApp.");
    if (!form.responsavelEmail.trim()) return toast.error("Informe o e-mail de acesso.");
    if (!form.senha) return toast.error("Informe uma senha.");
    if (form.senha.length < 6) return toast.error("A senha deve ter pelo menos 6 caracteres.");
    if (form.senha !== form.confirmarSenha) return toast.error("As senhas não conferem.");
    if (!form.aceitarTermos) return toast.error("Confirme que está ciente do período de teste.");

    try {
      setCarregando(true);
      const resposta = await fetch("/api/publico/cadastrar-empresa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await resposta.json().catch(() => null);
      if (!resposta.ok || json?.ok === false) {
        throw new Error(json?.error || "Erro ao cadastrar empresa.");
      }

      setResultado(json.data);
      toast.success("Empresa cadastrada com sucesso.");
    } catch (error: any) {
      toast.error(error?.message || "Erro ao cadastrar empresa.");
    } finally {
      setCarregando(false);
    }
  }

  if (resultado) {
    return (
      <div className="min-h-screen bg-[#070b12] p-5 text-white">
        <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center">
          <div className="w-full rounded-[2rem] border border-white/10 bg-[#111827] p-8 text-center shadow-2xl">
            <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-3xl border border-emerald-300/30 bg-emerald-400/10">
              <CheckCircle2 className="h-11 w-11 text-emerald-300" />
            </div>

            <h1 className="text-3xl font-black text-[#f6c24a]">Teste grátis liberado!</h1>
            <p className="mt-4 text-slate-300">Sua empresa foi cadastrada e o acesso está disponível por 7 dias.</p>

            <div className="mt-7 space-y-3 rounded-2xl border border-white/10 bg-black/30 p-5 text-left">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Empresa</p>
                <p className="font-bold text-white">{resultado.empresaNome}</p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Link de acesso</p>
                <p className="break-all font-bold text-[#f6c24a]">{resultado.linkAcesso}</p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">E-mail de acesso</p>
                <p className="font-bold text-white">{resultado.adminEmail}</p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Senha</p>
                <p className="font-bold text-white">A senha cadastrada por você</p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Validade do teste</p>
                <p className="font-bold text-white">{resultado.ativaAte}</p>
              </div>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button
                className="h-12 flex-1 rounded-xl bg-gradient-to-r from-[#b8860b] via-[#d4af37] to-[#f7d56b] font-black text-black"
                onClick={() => {
                  window.location.href = resultado.linkAcesso;
                }}
              >
                Acessar sistema
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              <Button
                variant="outline"
                className="h-12 flex-1 rounded-xl border-white/20 bg-transparent text-white hover:bg-white/10"
                onClick={() => navigate("/")}
              >
                Voltar
              </Button>
            </div>

            <p className="mt-6 text-xs text-slate-500">
              Após o período de teste, o acesso só será renovado mediante confirmação de pagamento pelo administrador.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b12] text-white">
      <div className="grid min-h-screen lg:grid-cols-[0.9fr_1.1fr]">
        <section className="hidden bg-black/30 p-10 lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex justify-center lg:justify-start">
              <img
                src="/oliver-erp-login.png"
                alt="OLIVER ERP"
                className="max-h-32 w-auto object-contain drop-shadow-2xl"
              />
            </div>

            <h1 className="mt-8 text-5xl font-black leading-tight">
              Teste grátis do sistema por 7 dias
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
              Cadastre sua empresa, crie sua senha de administrador e comece a usar o sistema com dados reais.
            </p>

            <div className="mt-10 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <p className="font-black text-[#f6c24a]">Liberação automática</p>
                <p className="mt-1 text-sm text-slate-400">O acesso de teste é criado na hora.</p>
              </div>

              

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <p className="font-black text-[#f6c24a]">Acesso por empresa</p>
                <p className="mt-1 text-sm text-slate-400">Cada empresa recebe um link próprio de acesso.</p>
              </div>
            </div>
          </div>

          <p className="text-sm text-slate-500">OLIVER ERP - Gestão Inteligente para Empresas © 2026</p>
        </section>

        <section className="flex items-center justify-center p-5">
          <form onSubmit={enviar} className="w-full max-w-3xl rounded-[2rem] border border-white/10 bg-white p-6 text-slate-900 shadow-2xl sm:p-8">
            <div className="mb-7 text-center">
              <h2 className="text-3xl font-black">Cadastrar empresa</h2>
              <p className="mt-2 text-slate-600">Preencha os dados para liberar o teste grátis por 7 dias.</p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label className="mb-2 block font-bold">Nome da empresa</Label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                  <Input value={form.empresaNome} onChange={(e) => atualizar("empresaNome", e.target.value)} placeholder="Ex.: Barbearia do João" className="h-13 rounded-xl pl-12 text-black" />
                </div>
                {slugPreview && <p className="mt-2 text-xs font-semibold text-slate-500">Link previsto: /{slugPreview}/login</p>}
              </div>

              <div>
                <Label className="mb-2 block font-bold">Segmento</Label>
                <Input value={form.segmento} onChange={(e) => atualizar("segmento", e.target.value)} placeholder="Barbearia, salão, clínica..." className="h-13 rounded-xl text-black" />
              </div>

              <div>
                <Label className="mb-2 block font-bold">CNPJ/CPF</Label>
                <Input value={form.documento} onChange={(e) => atualizar("documento", e.target.value)} placeholder="Opcional" className="h-13 rounded-xl text-black" />
              </div>

              <div>
                <Label className="mb-2 block font-bold">WhatsApp</Label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                  <Input value={form.telefone} onChange={(e) => atualizar("telefone", e.target.value)} placeholder="(00) 00000-0000" className="h-13 rounded-xl pl-12 text-black" />
                </div>
              </div>

              <div>
                <Label className="mb-2 block font-bold">E-mail comercial</Label>
                <Input value={form.email} onChange={(e) => atualizar("email", e.target.value)} placeholder="empresa@email.com" className="h-13 rounded-xl text-black" />
              </div>

              <div>
                <Label className="mb-2 block font-bold">Cidade</Label>
                <Input value={form.cidade} onChange={(e) => atualizar("cidade", e.target.value)} placeholder="Cidade" className="h-13 rounded-xl text-black" />
              </div>

              <div>
                <Label className="mb-2 block font-bold">UF</Label>
                <Input value={form.uf} onChange={(e) => atualizar("uf", e.target.value.toUpperCase().slice(0, 2))} placeholder="TO" className="h-13 rounded-xl text-black" />
              </div>

              <div className="md:col-span-2">
                <div className="my-2 border-t border-slate-200" />
                <p className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">Administrador do sistema</p>
              </div>

              <div>
                <Label className="mb-2 block font-bold">Nome do responsável</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                  <Input value={form.responsavelNome} onChange={(e) => atualizar("responsavelNome", e.target.value)} placeholder="Nome completo" className="h-13 rounded-xl pl-12 text-black" />
                </div>
              </div>

              <div>
                <Label className="mb-2 block font-bold">E-mail de acesso</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                  <Input value={form.responsavelEmail} onChange={(e) => atualizar("responsavelEmail", e.target.value)} placeholder="admin@email.com" className="h-13 rounded-xl pl-12 text-black" />
                </div>
              </div>

              <div>
                <Label className="mb-2 block font-bold">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                  <Input type={mostrarSenha ? "text" : "password"} value={form.senha} onChange={(e) => atualizar("senha", e.target.value)} placeholder="Mínimo 6 caracteres" className="h-13 rounded-xl px-12 text-black" />
                  <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
                    {mostrarSenha ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <Label className="mb-2 block font-bold">Confirmar senha</Label>
                <Input type={mostrarSenha ? "text" : "password"} value={form.confirmarSenha} onChange={(e) => atualizar("confirmarSenha", e.target.value)} placeholder="Repita a senha" className="h-13 rounded-xl text-black" />
              </div>
            </div>

            <label className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
              <input type="checkbox" checked={form.aceitarTermos} onChange={(e) => atualizar("aceitarTermos", e.target.checked)} className="mt-1" />
              <span>Declaro estar ciente de que este é um período de teste de 7 dias e que os dados lançados são de responsabilidade da empresa cadastrada.</span>
            </label>

            <Button type="submit" disabled={carregando} className="mt-6 h-14 w-full rounded-xl bg-gradient-to-r from-[#b8860b] via-[#d4af37] to-[#f7d56b] text-lg font-black text-black shadow-lg hover:brightness-105">
              {carregando ? "Criando teste..." : "Criar meu teste grátis"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <button type="button" onClick={() => navigate("/")} className="mt-4 w-full text-sm font-bold text-[#8a5b00]">Voltar</button>
          </form>
        </section>
      </div>
    </div>
  );
}
