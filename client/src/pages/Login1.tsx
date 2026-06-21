import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  Eye,
  EyeOff,
  Lock,
  BarChart3,
  LogIn,
  Mail,
  CalendarDays,
  Package,
  DollarSign,
  UserPlus,
  Clock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const EMPRESA_CONFIG_KEY = '@sistema_saas_empresa_config';

type LoginConfig = {
  nome?: string;
  marca?: string;
  logoDbo?: string;
  logoEmpresa?: string;
  fundoLogin?: string;
  avisoVencimento?: {
    tipo?: string;
    titulo?: string;
    mensagem?: string;
    bloqueado?: boolean;
    diasRestantes?: number | null;
  };
};

function carregarConfigLocal(): LoginConfig {
  try {
    return JSON.parse(localStorage.getItem(EMPRESA_CONFIG_KEY) || '{}');
  } catch {
    return {};
  }
}

export default function Login() {
  const [location, navigate] = useLocation();
  const slugEmpresa = String(location || "").split("/").filter(Boolean)[0] || "letsbarbearia";
  const { login } = useAuth();

  const [config, setConfig] = useState<LoginConfig>({
    logoDbo: '/logo-dbo.png',
    logoEmpresa: '',
    fundoLogin: '',
    marca: 'DBO',
  });

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [capsLockAtivo, setCapsLockAtivo] = useState(false);
  const [erroLogin, setErroLogin] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [modoSolicitarAcesso, setModoSolicitarAcesso] = useState(false);
  const [solicitacao, setSolicitacao] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    telefone: '',
  });

  useEffect(() => {
    const local = carregarConfigLocal();

    fetch(`/api/empresa-por-slug/${slugEmpresa}`, { headers: { 'x-empresa-slug': slugEmpresa } })
      .then((r) => r.json())
      .then((j) => {
        const empresa = j?.data || {};
        setConfig({
          logoDbo: empresa.logoDbo || '/logo-dbo.png',
          logoEmpresa: empresa.logoEmpresa || '',
          fundoLogin: empresa.fundoLogin || '',
          nome: empresa.nome || '',
          marca: empresa.marca || 'DBO',
          avisoVencimento: empresa.avisoVencimento,
        });
      })
      .catch(() => {
        setConfig({
          logoDbo: local.logoDbo || '/logo-dbo.png',
          logoEmpresa: '',
          fundoLogin: '',
          nome: '',
          marca: 'DBO',
        });
      });
  }, [slugEmpresa]);


  const solicitarAcesso = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!solicitacao.nome.trim()) return toast.error('Informe seu nome.');
    if (!solicitacao.email.trim()) return toast.error('Informe seu e-mail.');
    if (!solicitacao.senha) return toast.error('Informe uma senha.');
    if (solicitacao.senha.length < 6) return toast.error('A senha deve ter pelo menos 6 caracteres.');
    if (solicitacao.senha !== solicitacao.confirmarSenha) return toast.error('As senhas não conferem.');

    const novoPendente = {
      id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
      nome: solicitacao.nome.trim(),
      email: solicitacao.email.trim().toLowerCase(),
      senha: solicitacao.senha,
      telefone: solicitacao.telefone.trim(),
      perfil: 'Profissional',
      status: 'Pendente',
      criadoEm: new Date().toISOString(),
      permissoes: [],
    };

    try {
      setCarregando(true);

      const resposta = await fetch('/api/solicitar-acesso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-empresa-slug': slugEmpresa },
        body: JSON.stringify({
          nome: novoPendente.nome,
          email: novoPendente.email,
          senha: novoPendente.senha,
          telefone: novoPendente.telefone,
          empresaSlug: slugEmpresa,
        }),
      });

      const json = await resposta.json().catch(() => null);
      if (!resposta.ok || json?.ok === false) {
        throw new Error(json?.error || 'Erro ao enviar solicitação de acesso.');
      }

      toast.success('Solicitação enviada. Aguarde o administrador autorizar seu acesso.');
      setSolicitacao({ nome: '', email: '', senha: '', confirmarSenha: '', telefone: '' });
      setModoSolicitarAcesso(false);
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao solicitar acesso.');
    } finally {
      setCarregando(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Digite o e-mail do usuário.");
      return;
    }

    if (!senha) {
      toast.error("Digite a senha.");
      return;
    }

    try {
      setCarregando(true);
      setErroLogin("");

      await login(email.trim(), senha, slugEmpresa);

      toast.success("Login realizado com sucesso.");
      navigate(slugEmpresa ? `/${slugEmpresa}/` : "/");
    } catch (error: any) {
      const mensagem = error?.message || "E-mail ou senha inválidos.";
      setErroLogin(
        `${mensagem}${capsLockAtivo ? " Verifique também se o Caps Lock está ligado." : ""}`
      );
      toast.error(mensagem);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-slate-100">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section
          className="relative hidden overflow-hidden bg-[#02142f] text-white lg:flex"
          style={{
            backgroundImage: `url('${config.fundoLogin || '/background-login.jpg'}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#02142f]/95 via-[#041c45]/90 to-[#02142f]/95" />
          <div className="absolute inset-0 opacity-10 [background-image:linear-gradient(135deg,rgba(255,255,255,.15)_1px,transparent_1px)] [background-size:40px_40px]" />

          <div className="relative z-10 flex w-full flex-col justify-between p-14">
            <div>
              <div className="inline-flex items-center gap-4 rounded-3xl border border-white/10 bg-white/5 px-6 py-5 shadow-2xl backdrop-blur">
                {config.logoDbo ? (
                  <img
                    src={config.logoDbo}
                    alt="DBO"
                    className="h-24 w-auto max-w-[220px] object-contain drop-shadow-2xl"
                  />
                ) : (
                  <div className="bg-gradient-to-b from-[#f7d56b] via-[#e7b83d] to-[#b97710] bg-clip-text text-7xl font-black tracking-tight text-transparent">
                    DBO
                  </div>
                )}

                
              </div>

              <h2 className="mt-8 text-5xl font-black leading-tight">
                Tecnologia que conecta.
                <br />
                <span className="text-amber-400">Gestão</span> que transforma.
              </h2>

              <p className="mt-8 max-w-xl text-xl leading-9 text-slate-200">
                Controle agenda, clientes, profissionais, estoque, financeiro,
                comissões e relatórios em uma plataforma moderna para barbearias
                e salões.
              </p>

              <div className="mt-12 grid grid-cols-4 gap-5">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center backdrop-blur">
                  <CalendarDays className="mx-auto h-9 w-9 text-amber-400" />
                  <p className="mt-3 font-bold">Agenda</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center backdrop-blur">
                  <DollarSign className="mx-auto h-9 w-9 text-amber-400" />
                  <p className="mt-3 font-bold">Financeiro</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center backdrop-blur">
                  <Package className="mx-auto h-9 w-9 text-amber-400" />
                  <p className="mt-3 font-bold">Estoque</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center backdrop-blur">
                  <BarChart3 className="mx-auto h-9 w-9 text-amber-400" />
                  <p className="mt-3 font-bold">Relatórios</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <p className="text-lg text-slate-100">
                Mais organização, segurança e transparência para a gestão diária
                do seu negócio.
              </p>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center bg-gradient-to-br from-white to-slate-100 p-5">
          <div className="w-full max-w-xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-300/60 sm:p-10">
            <div className="mb-10 text-center">
              <div className="mx-auto mb-6 flex min-h-28 w-full items-center justify-center rounded-[2rem] border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 shadow-lg">
                {config.logoEmpresa ? (
                  <img
                    src={config.logoEmpresa}
                    alt={config.nome || "Empresa"}
                    className="max-h-24 max-w-[280px] object-contain"
                  />
                ) : (
                  <span className="bg-gradient-to-b from-[#f7d56b] via-[#e7b83d] to-[#b97710] bg-clip-text text-5xl font-black text-transparent">
                    {config.marca || 'DBO'}
                  </span>
                )}
              </div>

              <h1 className="text-4xl font-black text-slate-900 sm:text-5xl">
                {modoSolicitarAcesso ? 'Solicitar acesso' : 'Bem-vindo!'}
              </h1>

              <p className="mt-4 text-lg text-slate-600 sm:text-xl">
                {modoSolicitarAcesso
                  ? 'Preencha seus dados. O administrador precisa autorizar o acesso.'
                  : 'Acesse sua conta para continuar'}
              </p>

              <div className="mx-auto mt-5 h-1 w-24 rounded-full bg-amber-400" />
            </div>

            {config.avisoVencimento?.tipo && config.avisoVencimento.tipo !== 'ok' && (
              <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm font-semibold ${config.avisoVencimento.bloqueado ? 'border-red-200 bg-red-50 text-red-700' : config.avisoVencimento.tipo === 'critico' ? 'border-orange-200 bg-orange-50 text-orange-700' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
                <p className="font-black">{config.avisoVencimento.titulo}</p>
                <p className="mt-1">{config.avisoVencimento.mensagem}</p>
              </div>
            )}

            {!modoSolicitarAcesso ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label className="mb-2 block text-base font-bold text-slate-900">
                  E-mail
                </Label>

                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Digite seu e-mail"
                    className="h-14 rounded-xl pl-12 text-base text-black placeholder:text-slate-400 bg-white"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <Label className="mb-2 block text-base font-bold text-slate-900">
                  Senha
                </Label>

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

                  <Input
                    type={mostrarSenha ? "text" : "password"}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    onKeyUp={(e) => setCapsLockAtivo(e.getModifierState("CapsLock"))}
                    placeholder="Digite sua senha"
                    className="h-14 rounded-xl px-12 text-base text-black placeholder:text-slate-400 bg-white"
                    autoComplete="current-password"
                  />

                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {mostrarSenha ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {capsLockAtivo && (
                  <p className="mt-2 text-sm font-medium text-red-600">
                    Caps Lock está ligado
                  </p>
                )}
              </div>

              {erroLogin && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  {erroLogin}
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-600">
                  <input type="checkbox" />
                  Lembrar-me
                </label>

                <button
                  type="button"
                  className="font-medium text-blue-600"
                  onClick={() => {
                    toast.info("Entre em contato com o administrador para recuperar a senha.");
                  }}
                >
                  Esqueceu sua senha?
                </button>
              </div>

              <Button
                type="submit"
                disabled={carregando}
                className="h-14 w-full rounded-xl bg-[#111111] text-lg font-bold text-white shadow-lg hover:bg-[#2A2A2A]"
              >
                <LogIn className="mr-2 h-5 w-5" />
                {carregando ? "Entrando..." : "Entrar no Sistema"}
              </Button>
              <button
                type="button"
                onClick={() => setModoSolicitarAcesso(true)}
                className="w-full rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 hover:bg-blue-100"
              >
                <UserPlus className="mr-1 inline h-4 w-4" />
                Criar usuário / Solicitar acesso
              </button>
            </form>
            ) : (
            <form onSubmit={solicitarAcesso} className="space-y-5">
              <div>
                <Label className="mb-2 block text-base font-bold text-slate-900">Nome completo</Label>
                <Input value={solicitacao.nome} onChange={(e) => setSolicitacao({ ...solicitacao, nome: e.target.value })} placeholder="Digite seu nome" className="h-14 rounded-xl text-base text-black bg-white" />
              </div>

              <div>
                <Label className="mb-2 block text-base font-bold text-slate-900">E-mail</Label>
                <Input value={solicitacao.email} onChange={(e) => setSolicitacao({ ...solicitacao, email: e.target.value })} placeholder="Digite seu e-mail" className="h-14 rounded-xl text-base text-black bg-white" />
              </div>

              <div>
                <Label className="mb-2 block text-base font-bold text-slate-900">Telefone / WhatsApp</Label>
                <Input value={solicitacao.telefone} onChange={(e) => setSolicitacao({ ...solicitacao, telefone: e.target.value })} placeholder="Opcional" className="h-14 rounded-xl text-base text-black bg-white" />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label className="mb-2 block text-base font-bold text-slate-900">Senha</Label>
                  <Input type="password" value={solicitacao.senha} onChange={(e) => setSolicitacao({ ...solicitacao, senha: e.target.value })} placeholder="Mínimo 6 caracteres" className="h-14 rounded-xl text-base text-black bg-white" />
                </div>
                <div>
                  <Label className="mb-2 block text-base font-bold text-slate-900">Confirmar senha</Label>
                  <Input type="password" value={solicitacao.confirmarSenha} onChange={(e) => setSolicitacao({ ...solicitacao, confirmarSenha: e.target.value })} placeholder="Repita a senha" className="h-14 rounded-xl text-base text-black bg-white" />
                </div>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
                <Clock className="mr-1 inline h-4 w-4" />
                Após solicitar, o usuário ficará como pendente até o administrador autorizar.
              </div>

              <Button type="submit" disabled={carregando} className="h-14 w-full rounded-xl bg-[#111111] text-lg font-bold text-white shadow-lg hover:bg-[#2A2A2A]">
                <UserPlus className="mr-2 h-5 w-5" />
                {carregando ? 'Enviando...' : 'Solicitar acesso'}
              </Button>

              <button type="button" onClick={() => setModoSolicitarAcesso(false)} className="w-full text-sm font-bold text-blue-600">
                Voltar para o login
              </button>
            </form>
            )}

           
            <div className="my-8 border-t border-slate-200" />

            <div className="text-center">
              <p className="text-sm font-bold text-slate-800">
                DBO Sistema SaaS - Sistema Inteligente de Gestão
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Todos os direitos reservados © 2026
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
