import { type Project, type Portfolio } from './schema.js';

export interface ProjectResult {
  // Datos del proyecto
  title: string;
  description: string;
  stack: string[];
  repo?: string;
  lastCommit?: string;
  // Datos del dueño — para que el agente pueda presentar contacto
  owner: {
    name: string;
    contact?: string;
    contactable: boolean;
    links?: {
      github?: string;
      x?: string;
      linkedin?: string;
    };
  };
}

/**
 * Busca proyectos por título, descripción o stack.
 * Devuelve resultados enriquecidos con datos del dueño del portafolio,
 * listos para ser consumidos por un agente via MCP.
 *
 * Ejemplo de output que un agente puede verbalizar:
 *   "Encontré un proyecto similar de [owner.name]: [title] ([stack]).
 *    Último commit: [lastCommit]. Repo: [repo]. Contacto: [contact]."
 */
export function buscarProyectos(portfolio: Portfolio, query: string): ProjectResult[] {
  const projects: Project[] = query.trim()
    ? portfolio.projects.filter((p) => {
        const q = query.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.stack.some((s) => s.toLowerCase().includes(q))
        );
      })
    : portfolio.projects;

  return projects.map((p) => ({
    title: p.title,
    description: p.description,
    stack: p.stack,
    repo: p.repo,
    lastCommit: p.lastCommit,
    owner: {
      name: portfolio.name,
      contact: portfolio.contact,
      contactable: portfolio.contactable,
      links: portfolio.links,
    },
  }));
}
