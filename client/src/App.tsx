import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BarbeariaProvider } from "@/contexts/BarbeariaContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

import Agendamentos from "@/pages/Agendamentos";
import Clientes from "@/pages/Clientes";
import Home from "@/pages/Home";
import NotFound from "@/pages/NotFound";
import Relatorios from "@/pages/Relatorios";
import Servico from "@/pages/Servico";
import Financeiro from "@/pages/Financeiro";
import Profissionais from "@/pages/Profissionais";
import Planos from "@/pages/Planos";
import FilaAtendimento from "@/pages/FilaAtendimento";
import Despesas from "@/pages/Despesas";
import FluxoCaixa from "@/pages/FluxoCaixa";
import DRE from "@/pages/DRE";
import ProdutosEstoque from "@/pages/ProdutosEstoque";
import Configuracoes from "@/pages/Configuracoes";
import Login from "@/pages/Login";
import AgendamentoCliente from "@/pages/AgendamentoCliente";
import UsuariosPermissoes from "@/pages/UsuariosPermissoes";
import AdminMaster from "@/pages/AdminMaster";
import CadastroEmpresa from "@/pages/CadastroEmpresa";
import EsqueciSenha from "@/pages/EsqueciSenha";
import RedefinirSenha from "@/pages/RedefinirSenha";


import {
  BarChart3,
  Calendar,
  ClipboardList,
  DollarSign,
  HelpCircle,
  Home as HomeIcon,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Package,
  Settings,
  Scissors,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { Route, Switch, useLocation } from "wouter";
import { useEffect, useState } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Button } from "./components/ui/button";

const navigationItems = [
  { path: "/", label: "Início", icon: HomeIcon, permissao: "inicio.ver" },
  { path: "/agendamentos", label: "Agenda", icon: Calendar, permissao: "agenda.ver" },
  { path: "/clientes", label: "Clientes", icon: Users, permissao: "clientes.ver" },
  { path: "/profissionais", label: "Profissionais", icon: Users, permissao: "profissionais.ver" },
  { path: "/servicos", label: "Serviços", icon: Scissors, permissao: "servicos.ver" },
  { path: "/produtos", label: "Produtos / Estoque", icon: Package, permissao: "produtos.ver" },
  { path: "/financeiro", label: "Financeiro", icon: DollarSign, permissao: "financeiro.ver" },
  { path: "/despesas", label: "Despesas", icon: DollarSign, permissao: "despesas.ver" },
  { path: "/fluxo-caixa", label: "Fluxo de Caixa", icon: DollarSign, permissao: "fluxo.ver" },
  { path: "/dre", label: "DRE", icon: BarChart3, permissao: "relatorios.ver" },
  { path: "/pacotes", label: "Pacotes e Assinaturas", icon: ClipboardList, permissao: "pacotes.ver" },
  { path: "/fila", label: "Fila de Espera", icon: Users, permissao: "fila.ver" },
  { path: "/relatorios", label: "Relatórios", icon: BarChart3, permissao: "relatorios.ver" },
  { path: "/configuracoes", label: "Configurações", icon: Settings, permissao: "configuracoes.ver" },
  { path: "/usuarios-permissoes", label: "Usuários e Permissões", icon: ShieldCheck, permissao: "usuarios.gerenciar" },

];

const EMPRESA_CONFIG_KEY = "@sistema_saas_empresa_config";

type EmpresaMenuConfig = {
  nome?: string;
  marca?: string;
  logoEmpresa?: string;
  logoMenu?: string;
  slogan?: string;
  observacao?: string;
};

const empresaMenuPadrao: EmpresaMenuConfig = {
  nome: "",
  marca: "",
  logoEmpresa: "",
  logoMenu: "",
  slogan: "",
  observacao: "",
};

function slugDaRota(pathname: string) {
  const seg = String(pathname || "").split("?")[0].split("/").filter(Boolean)[0] || "";
  const reservados = new Set(["login", "agendar", "admin", "admin-master", "cadastrar-empresa", "empresa-nao-informada", "esqueci-senha", "redefinir-senha", "404"]);
  return seg && !reservados.has(seg) ? seg : "";
}

function prefixarRota(path: string, slug: string) {
  if (!slug) return path;
  if (path === "/") return `/${slug}/`;
  return `/${slug}${path}`;
}

function rotaInterna(pathname: string) {
  const slug = slugDaRota(pathname);
  if (!slug) return pathname || "/";
  const semSlug = String(pathname || "/").replace(`/${slug}`, "") || "/";
  return semSlug === "" ? "/" : semSlug;
}

function carregarEmpresaMenuLocal(): EmpresaMenuConfig {
  // Não reaproveita logo salva de outra empresa no navegador.
  // A identidade visual sempre vem do banco pelo slug da URL.
  return empresaMenuPadrao;
}

function useEmpresaMenuConfig() {
  const [location] = useLocation();
  const slug = slugDaRota(location);
  const [empresa, setEmpresa] = useState<EmpresaMenuConfig>(carregarEmpresaMenuLocal);

  useEffect(() => {
    let ativo = true;

    fetch(slug ? `/api/empresa-por-slug/${slug}` : "/api/empresa")
      .then((r) => r.json())
      .then((j) => {
        const dados = j?.data || {};
        const atualizado: EmpresaMenuConfig = {
          ...empresaMenuPadrao,
          ...dados,
          logoEmpresa: dados.logoEmpresa || "",
          logoMenu: dados.logoMenu || dados.logoEmpresa || "",
          slogan: dados.slogan || "",
        };

        localStorage.setItem(`${EMPRESA_CONFIG_KEY}_${slug || 'padrao'}`, JSON.stringify(atualizado));
        if (ativo) setEmpresa(atualizado);
      })
      .catch(() => {
        if (ativo) setEmpresa(empresaMenuPadrao);
      });

    return () => {
      ativo = false;
    };
  }, [slug]);

  return empresa;
}

function EmpresaLogo({
  collapsed = false,
  className = "",
}: {
  collapsed?: boolean;
  className?: string;
}) {
  const empresa = useEmpresaMenuConfig();

  const logo = empresa.logoMenu || empresa.logoEmpresa || "";
  if (!logo) {
    return (
      <div className={`mx-auto grid place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-center font-black text-[#f6c24a] ${collapsed ? "h-12 w-12 text-xs" : "h-16 w-full max-w-[200px] text-sm"} ${className}`}>
        {empresa.marca || empresa.nome || "DBO"}
      </div>
    );
  }

  return (
    <img
      src={logo}
      alt={empresa.nome || "Logo Empresa"}
      className={`mx-auto object-contain transition-all duration-300 ${
        collapsed ? "h-12 w-12" : "h-20 w-auto max-w-[200px]"
      } ${className}`}
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  );
}

function useMenuItems() {
  const { pode, usuario } = useAuth();

  if (usuario?.perfil === "Administrador") return navigationItems;

  return navigationItems.filter((item) => {
    if (item.path === "/") return true;
    return pode(item.permissao);
  });
}

function Navigation() {
  const [location, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const { usuario, logout } = useAuth();
  const menuItems = useMenuItems();
  const empresa = useEmpresaMenuConfig();
  const slug = slugDaRota(location);
  const atual = rotaInterna(location);

  return (
    <>
      <div className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center gap-3 border-b border-white/10 bg-[#070b12]/95 px-4 text-white shadow-xl backdrop-blur md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04]"
          aria-label="Abrir menu"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-[#f6c24a]">{usuario?.nome || "Gestão Inteligente"}</p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-red-300"
          aria-label="Sair"
          title="Sair"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm md:hidden"
            onClick={() => setOpen(false)}
          />

          <aside className="fixed left-0 top-0 z-50 flex h-screen w-80 max-w-[86vw] flex-col border-r border-white/10 bg-[#070b12] text-white shadow-2xl md:hidden">
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-5">
              <div className="min-w-0">
                <EmpresaLogo className="!mx-0 !h-16 !w-auto !max-w-[170px]" />

              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-slate-100 hover:bg-white/10"
                aria-label="Fechar menu"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-4 py-3 pr-3">
              {menuItems.map(({ path, label, icon: Icon }) => {
                const active = atual === path;
                return (
                  <Button
                    key={path}
                    variant="ghost"
                    className={`h-10 w-full justify-start gap-3 rounded-xl text-sm ${
                      active
                        ? "border border-[#f6b21a]/60 bg-[#f6b21a]/15 text-[#f6b21a]"
                        : "text-slate-100 hover:bg-white/5 hover:text-[#f6b21a]"
                    }`}
                    onClick={() => {
                      navigate(prefixarRota(path, slug));
                      setOpen(false);
                    }}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Button>
                );
              })}
            </nav>

            <div className="border-t border-white/10 p-3">
              <Button
                variant="ghost"
                className="mb-2 h-9 w-full justify-center gap-2 rounded-xl border border-white/10 text-sm text-slate-100 hover:bg-white/5"
              >
                <HelpCircle className="h-4 w-4" />
                Suporte
              </Button>
              <Button
                variant="outline"
                className="h-9 w-full justify-center gap-2 rounded-xl border-red-400/30 text-sm text-red-300 hover:bg-red-500/10"
                onClick={logout}
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
              <p className="mt-2 text-center text-[10px] font-medium text-slate-600">OLIVER ERP - Gestão Inteligente para Empresas © 2026</p>
            </div>
          </aside>
        </>
      )}
    </>
  );
}

function DBOLetterLogo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className="leading-none">
      <div
        className={`bg-gradient-to-b from-[#f7d56b] via-[#e7b83d] to-[#b97710] bg-clip-text font-black tracking-tight text-transparent transition-all ${
          collapsed ? "text-3xl" : "text-6xl"
        }`}
      >
        DBO
      </div>
    </div>
  );
}

function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const [location, navigate] = useLocation();
  const { usuario, logout } = useAuth();
  const menuItems = useMenuItems();
  const empresa = useEmpresaMenuConfig();
  const slug = slugDaRota(location);
  const atual = rotaInterna(location);

  return (
    <aside
      className={`hidden md:flex fixed left-0 top-0 bottom-0 z-30 h-screen min-h-0 flex-col border-r border-white/10 bg-[#070b12] text-white shadow-2xl transition-all duration-300 ${
        collapsed ? "w-20" : "w-72"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-3 z-40 grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/10"
        aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        title={collapsed ? "Expandir menu" : "Recolher menu"}
      >
        {collapsed ? (
          <PanelLeftOpen className="h-5 w-5" />
        ) : (
          <PanelLeftClose className="h-5 w-5" />
        )}
      </button>

      <div className={`${collapsed ? "px-3 py-4 text-center" : "px-5 py-4"}`}>
        <EmpresaLogo collapsed={collapsed} />
      </div>

     
      <nav
        className={`min-h-0 flex-1 space-y-1 overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent ${
          collapsed ? "px-3" : "px-5 pr-3"
        }`}
      >
        {menuItems.map(({ path, label, icon: Icon }) => {
          const active = atual === path;
          return (
            <Button
              key={path}
              variant="ghost"
              title={collapsed ? label : undefined}
              className={`h-10 w-full rounded-xl text-sm ${
                collapsed ? "justify-center px-0" : "justify-start gap-3"
              } ${
                active
                  ? "border border-[#f6b21a]/60 bg-[#f6b21a]/15 text-[#f6b21a] shadow-[0_0_25px_rgba(246,178,26,0.12)]"
                  : "text-slate-100 hover:bg-white/5 hover:text-[#f6b21a]"
              }`}
              onClick={() => navigate(prefixarRota(path, slug))}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </Button>
          );
        })}
      </nav>

      <div className={`shrink-0 border-t border-white/10 pb-3 pt-3 ${collapsed ? "px-3" : "px-4"}`}>
        <Button
          variant="ghost"
          title={collapsed ? "Suporte" : undefined}
          className={`mb-2 h-9 w-full rounded-xl border border-white/10 text-slate-100 hover:bg-white/5 ${
            collapsed ? "justify-center px-0" : "justify-center gap-2 text-sm"
          }`}
        >
          <HelpCircle className="h-4 w-4" />
          {!collapsed && "Suporte"}
        </Button>

        <Button
          variant="outline"
          className={`${collapsed ? "grid h-10 w-10 place-items-center rounded-full px-0" : "h-9 w-full justify-center gap-2 rounded-xl text-sm"} border-red-400/30 text-red-300 hover:bg-red-500/10`}
          onClick={logout}
          title="Sair"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Sair</span>}
        </Button>

        {!collapsed && (
          <p className="mt-2 text-center text-[10px] font-medium text-slate-600">
            OLIVER ERP © 2026
          </p>
        )}
      </div>
    </aside>
  );
}

function Router() {
  const { pode, usuario } = useAuth();
  const [location] = useLocation();
  const slug = slugDaRota(location);
  const base = slug ? `/${slug}` : "";

  const bloqueado = (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <div className="max-w-md rounded-2xl border bg-card p-6 text-center shadow-sm">
        <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-primary" />
        <h1 className="text-xl font-bold">Acesso não permitido</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Seu usuário não possui permissão para acessar esta tela.
        </p>
      </div>
    </div>
  );

  const tem = (permissao: string) => usuario?.perfil === "Administrador" || pode(permissao);

  return (
    <Switch>
      <Route path={`${base}/`}>{() => <Home />}</Route>
      <Route path={`${base}/agendamentos`}>{() => (tem("agenda.ver") ? <Agendamentos /> : bloqueado)}</Route>
      <Route path={`${base}/clientes`}>{() => (tem("clientes.ver") ? <Clientes /> : bloqueado)}</Route>
      <Route path={`${base}/profissionais`}>{() => (tem("profissionais.ver") ? <Profissionais /> : bloqueado)}</Route>
      <Route path={`${base}/servicos`}>{() => (tem("servicos.ver") ? <Servico /> : bloqueado)}</Route>
      <Route path={`${base}/produtos`}>{() => (tem("produtos.ver") ? <ProdutosEstoque /> : bloqueado)}</Route>
      <Route path={`${base}/fila`}>{() => (tem("fila.ver") ? <FilaAtendimento /> : bloqueado)}</Route>
      <Route path={`${base}/financeiro`}>{() => (tem("financeiro.ver") ? <Financeiro /> : bloqueado)}</Route>
      <Route path={`${base}/despesas`}>{() => (tem("despesas.ver") ? <Despesas /> : bloqueado)}</Route>
      <Route path={`${base}/fluxo-caixa`}>{() => (tem("fluxo.ver") ? <FluxoCaixa /> : bloqueado)}</Route>
      <Route path={`${base}/dre`} component={DRE} />
      <Route path={`${base}/pacotes`}>{() => (tem("pacotes.ver") ? <Planos /> : bloqueado)}</Route>
      <Route path={`${base}/relatorios`}>{() => (tem("relatorios.ver") ? <Relatorios /> : bloqueado)}</Route>
      <Route path={`${base}/configuracoes`}>{() => (tem("configuracoes.ver") ? <Configuracoes /> : bloqueado)}</Route>
      <Route path={`${base}/usuarios-permissoes`}>{() => (tem("usuarios.gerenciar") ? <UsuariosPermissoes /> : bloqueado)}</Route>
      <Route path={`${base}/404`} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { usuario } = useAuth();
  const aviso = usuario?.avisoVencimento;

  return (
    <div className="min-h-screen bg-[#070b12]">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((atual) => !atual)}
      />
      <main
        className={`min-h-screen flex-1 pt-14 transition-all duration-300 md:pt-0 ${
          sidebarCollapsed ? "md:ml-20" : "md:ml-72"
        }`}
      >
        {aviso?.tipo && aviso.tipo !== "ok" && !aviso.bloqueado && (
          <div className={`m-4 rounded-2xl border px-4 py-3 text-sm font-semibold md:m-5 ${aviso.tipo === "critico" ? "border-orange-300 bg-orange-50 text-orange-800" : "border-amber-300 bg-amber-50 text-amber-800"}`}>
            <p className="font-black">{aviso.titulo}</p>
            <p>{aviso.mensagem}</p>
          </div>
        )}
        <Router />
      </main>
      <Navigation />
    </div>
  );
}

function EmpresaNaoInformada() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070b12] p-6 text-white">
      <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-[#111827] p-8 text-center shadow-2xl">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl border border-[#f6c24a]/30 bg-[#f6c24a]/10">
          <ShieldCheck className="h-8 w-8 text-[#f6c24a]" />
        </div>

        <h1 className="text-3xl font-black text-[#f6c24a]">
          Empresa não informada
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-300">
          Para acessar o sistema, utilize o link exclusivo fornecido pela empresa.
        </p>

        <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4 text-left text-sm text-slate-300">
          <p className="font-bold text-white">Formato correto:</p>
          <p className="mt-2 break-all text-[#f6c24a]">
            https://oliver-erp-production.up.railway.app/nome-da-empresa/login
          </p>
        </div>

        <p className="mt-6 text-xs text-slate-500">
          OLIVER ERP - Gestão Inteligente para Empresas
        </p>
      </div>
    </div>
  );
}

function ProtectedApp() {
  const { logado, carregando } = useAuth();
  const [location, navigate] = useLocation();
  const slug = slugDaRota(location);

  const rotaLogin = Boolean(slug && location === `/${slug}/login`);
  const rotaCadastroEmpresa = location === "/cadastrar-empresa";
  const rotaEsqueciSenha = Boolean(slug && location === `/${slug}/esqueci-senha`);
  const rotaRedefinirSenha = Boolean(slug && location.startsWith(`/${slug}/redefinir-senha`));

  const rotaSemEmpresa =
    location === "/" ||
    location === "/login" ||
    location === "/empresa-nao-informada";

  const rotaAdmin = location === "/admin" || location === "/admin/login" || location === "/admin/empresas";
  const rotaPublicaAgendamento = location === "/agendar" || location.startsWith("/agendar?") || Boolean(slug && (location === `/${slug}/agendar` || location.startsWith(`/${slug}/agendar?`)));

  useEffect(() => {
    if (
      rotaPublicaAgendamento ||
      rotaAdmin ||
      rotaSemEmpresa ||
      rotaCadastroEmpresa ||
      rotaEsqueciSenha ||
      rotaRedefinirSenha
    ) {
      return;
    }

    if (!carregando && !logado && !rotaLogin) {
      if (!slug) {
        navigate("/empresa-nao-informada");
        return;
      }

      navigate(`/${slug}/login`);
    }

    if (!carregando && logado && rotaLogin) {
      navigate(`/${slug}/`);
    }
  }, [carregando, logado, location, navigate, rotaPublicaAgendamento, rotaLogin, rotaAdmin, rotaSemEmpresa, rotaCadastroEmpresa, rotaEsqueciSenha, rotaRedefinirSenha, slug]);

  if (rotaAdmin) {
    return <AdminMaster />;
  }

  if (rotaCadastroEmpresa) {
    return <CadastroEmpresa />;
  }

  if (rotaEsqueciSenha) {
    return <EsqueciSenha />;
  }

  if (rotaRedefinirSenha) {
    return <RedefinirSenha />;
  }

  if (rotaPublicaAgendamento) {
    return <AgendamentoCliente />;
  }

  if (rotaSemEmpresa) {
    return <EmpresaNaoInformada />;
  }

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070b12] text-white">
        Carregando...
      </div>
    );
  }

  if (!logado) {
    return <Login />;
  }

  return <AppContent />;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <AuthProvider>
            <BarbeariaProvider>
              <Toaster />
              <ProtectedApp />
            </BarbeariaProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
