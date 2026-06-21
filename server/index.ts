import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { registerApiRoutes } from "./routes";
import { query, withEmpresaContext } from "./db";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");


function lerCookie(cookieHeader: string | undefined, nome: string) {
  const cookie = String(cookieHeader || "");
  const partes = cookie.split(";").map((p) => p.trim());
  const encontrado = partes.find((p) => p.startsWith(`${nome}=`));
  return encontrado ? decodeURIComponent(encontrado.slice(nome.length + 1)) : "";
}

function primeiroSegmento(url: string) {
  const seg = String(url || "").split("?")[0].split("/").filter(Boolean)[0] || "";
  const reservados = new Set(["api", "admin", "admin-master", "assets", "uploads", "agendar", "login"]);
  return reservados.has(seg) ? "" : seg;
}

async function resolverEmpresa(req: express.Request) {
  const body: any = req.body || {};
  const queryParams: any = req.query || {};
  const slug =
    String(body.empresaSlug || body.slug || queryParams.empresaSlug || queryParams.slug || req.headers["x-empresa-slug"] || lerCookie(req.headers.cookie, "empresa_slug") || primeiroSegmento(req.originalUrl) || "").trim().toLowerCase();

  if (slug) {
    const rows = await query<any>("SELECT id, slug FROM empresas WHERE slug = ? LIMIT 1", [slug]).catch(() => []);
    if (rows[0]) return { empresaId: Number(rows[0].id), empresaSlug: rows[0].slug };
  }

  const cookieEmpresaId = Number(lerCookie(req.headers.cookie, "empresa_id") || req.headers["x-empresa-id"] || process.env.EMPRESA_ID || 1);
  return { empresaId: cookieEmpresaId || 1, empresaSlug: slug || lerCookie(req.headers.cookie, "empresa_slug") || "letsbarbearia" };
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  const port = Number(process.env.PORT || 3000);

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Arquivos enviados pelo Painel Master: /uploads/empresas/{empresa_id}/...
  app.use("/uploads", express.static(path.resolve(process.cwd(), "server", "uploads")));

  app.use(async (req, _res, next) => {
    try {
      const ctx = await resolverEmpresa(req);
      withEmpresaContext(ctx, () => next());
    } catch (error) {
      withEmpresaContext({ empresaId: Number(process.env.EMPRESA_ID || 1), empresaSlug: "letsbarbearia" }, () => next());
    }
  });

  registerApiRoutes(app);

  if (process.env.NODE_ENV === "production") {
    const staticPath = path.resolve(projectRoot, "dist", "public");
    app.use(express.static(staticPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(staticPath, "index.html"));
    });
  } else {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      configFile: path.resolve(projectRoot, "vite.config.ts"),
      server: { middlewareMode: true, hmr: { server } },
      appType: "spa",
    });

    app.use(vite.middlewares);
    app.get("*", async (req, res, next) => {
      try {
        const url = req.originalUrl;
        let template = await vite.transformIndexHtml(
          url,
          await import("node:fs/promises").then((fs) => fs.readFile(path.resolve(projectRoot, "client", "index.html"), "utf-8"))
        );
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (error) {
        vite.ssrFixStacktrace(error as Error);
        next(error);
      }
    });
  }

  server.listen(port, "0.0.0.0", () => {
    console.log(`Server + Banco rodando em http://localhost:${port}/`);
    console.log(`Teste do banco/API: http://localhost:${port}/api/health`);
  });
}

startServer().catch((error) => {
  console.error("Erro ao iniciar servidor:", error);
  process.exit(1);
});
