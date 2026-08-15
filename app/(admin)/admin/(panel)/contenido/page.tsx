import { prisma } from "@/lib/prisma";
import {
  addStoryAction,
  addEventAction,
  addPartnerAction,
  deleteStoryAction,
  deleteEventAction,
  deletePartnerAction,
} from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminContenidoPage() {
  const [stories, events, partners] = await Promise.all([
    prisma.story.findMany({ orderBy: { order: "asc" } }),
    prisma.event.findMany({ orderBy: { date: "desc" } }),
    prisma.partner.findMany({ orderBy: { order: "asc" } }),
  ]);

  return (
    <>
      <div className="admin-panel-card">
        <h2>Historias en video</h2>
        <form action={addStoryAction} className="admin-form-grid">
          <div className="field">
            <label htmlFor="story-title">Título</label>
            <input id="story-title" name="title" required />
          </div>
          <div className="field">
            <label htmlFor="story-video">URL video (YouTube)</label>
            <input id="story-video" name="videoUrl" placeholder="https://youtube.com/..." />
          </div>
          <div className="field full">
            <label htmlFor="story-desc">Descripción</label>
            <textarea id="story-desc" name="description" rows={2} />
          </div>
          <div className="full">
            <button type="submit" className="btn btn-primary btn-sm">
              Agregar historia
            </button>
          </div>
        </form>
        <div className="admin-row-list" style={{ marginTop: 20 }}>
          {stories.map((s) => (
            <div className="admin-item" key={s.id}>
              <div>
                <strong>{s.title}</strong>
                <div className="meta">{s.videoUrl ?? "Sin video"}</div>
              </div>
              <form action={deleteStoryAction.bind(null, s.id)}>
                <button type="submit" className="btn btn-danger btn-sm">
                  Eliminar
                </button>
              </form>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-panel-card">
        <h2>Eventos</h2>
        <form action={addEventAction} className="admin-form-grid">
          <div className="field">
            <label htmlFor="event-title">Título</label>
            <input id="event-title" name="title" required />
          </div>
          <div className="field">
            <label htmlFor="event-date">Fecha</label>
            <input id="event-date" name="date" type="datetime-local" required />
          </div>
          <div className="field">
            <label htmlFor="event-place">Lugar</label>
            <input id="event-place" name="place" />
          </div>
          <div className="field full">
            <label htmlFor="event-desc">Descripción</label>
            <textarea id="event-desc" name="description" rows={2} />
          </div>
          <div className="full">
            <button type="submit" className="btn btn-primary btn-sm">
              Agregar evento
            </button>
          </div>
        </form>
        <div className="admin-row-list" style={{ marginTop: 20 }}>
          {events.map((e) => (
            <div className="admin-item" key={e.id}>
              <div>
                <strong>{e.title}</strong>
                <div className="meta">
                  {e.date.toLocaleString("es-CO")} · {e.place}
                </div>
              </div>
              <form action={deleteEventAction.bind(null, e.id)}>
                <button type="submit" className="btn btn-danger btn-sm">
                  Eliminar
                </button>
              </form>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-panel-card">
        <h2>Aliados</h2>
        <form action={addPartnerAction} className="admin-form-grid">
          <div className="field">
            <label htmlFor="partner-name">Nombre</label>
            <input id="partner-name" name="name" required />
          </div>
          <div className="field" style={{ display: "flex", alignItems: "flex-end" }}>
            <button type="submit" className="btn btn-primary btn-sm">
              Agregar aliado
            </button>
          </div>
        </form>
        <div className="admin-row-list" style={{ marginTop: 20 }}>
          {partners.map((p) => (
            <div className="admin-item" key={p.id}>
              <div>
                <strong>{p.name}</strong>
                <div className="meta">{p.active ? "Visible" : "Oculto"}</div>
              </div>
              <form action={deletePartnerAction.bind(null, p.id)}>
                <button type="submit" className="btn btn-danger btn-sm">
                  Eliminar
                </button>
              </form>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
