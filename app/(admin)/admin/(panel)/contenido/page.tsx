import { prisma } from "@/lib/prisma";
import { HistoriaImageForm } from "@/components/admin/HistoriaImageForm";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";
import {
  addStoryAction,
  addEventAction,
  addPartnerAction,
  deleteStoryAction,
  deleteEventAction,
  deletePartnerAction,
  deleteHistoriaImageAction,
  saveHistoriaTagAction,
  getHistoriaGalleryData,
} from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminContenidoPage() {
  const [stories, events, partners, historia] = await Promise.all([
    prisma.story.findMany({ orderBy: { order: "asc" } }),
    prisma.event.findMany({ orderBy: { date: "desc" } }),
    prisma.partner.findMany({ orderBy: { order: "asc" } }),
    getHistoriaGalleryData(),
  ]);

  return (
    <>
      <div className="admin-panel-card">
        <h2>Galería de la sección Historia</h2>
        <p style={{ color: "#7a8896", fontSize: "0.88rem", marginBottom: 16 }}>
          Imágenes del carrusel en la landing (cambian cada 5 segundos).
        </p>
        <form action={saveHistoriaTagAction} className="admin-form-grid" style={{ marginBottom: 20 }}>
          <div className="field">
            <label htmlFor="historia-tag">Etiqueta sobre la imagen</label>
            <input id="historia-tag" name="tag" defaultValue={historia.tag} />
          </div>
          <div className="field" style={{ display: "flex", alignItems: "flex-end" }}>
            <button type="submit" className="btn btn-outline btn-sm">
              Guardar etiqueta
            </button>
          </div>
        </form>
        <HistoriaImageForm />
        <div className="admin-row-list" style={{ marginTop: 20 }}>
          {historia.images.map((url) => (
            <div className="admin-item" key={url}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" style={{ width: 64, height: 48, objectFit: "cover", borderRadius: 8 }} />
                <code style={{ fontSize: "0.75rem" }}>{url}</code>
              </div>
              <form action={deleteHistoriaImageAction}>
                <input type="hidden" name="imageUrl" value={url} />
                <button type="submit" className="btn btn-danger btn-sm">
                  Quitar
                </button>
              </form>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-panel-card">
        <h2>Historias en video</h2>
        <form action={addStoryAction} className="admin-form-grid">
          <div className="field">
            <label htmlFor="story-title">Título</label>
            <input id="story-title" name="title" required />
          </div>
          <div className="field">
            <label htmlFor="story-video">Enlace (YouTube, Instagram, reel)</label>
            <input
              id="story-video"
              name="videoUrl"
              placeholder="https://youtube.com/... o https://instagram.com/reel/..."
            />
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
                <div className="meta">{s.videoUrl ?? "Sin enlace"}</div>
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
        <form action={addPartnerAction} className="admin-form-grid" encType="multipart/form-data">
          <div className="field">
            <label htmlFor="partner-name">Nombre</label>
            <input id="partner-name" name="name" required />
          </div>
          <AdminImageUpload name="logoUrl" label="Logo del aliado" />
          <div className="full">
            <button type="submit" className="btn btn-primary btn-sm">
              Agregar aliado
            </button>
          </div>
        </form>
        <div className="admin-row-list" style={{ marginTop: 20 }}>
          {partners.map((p) => (
            <div className="admin-item" key={p.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {p.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.logoUrl} alt="" style={{ width: 56, height: 40, objectFit: "contain" }} />
                ) : null}
                <div>
                  <strong>{p.name}</strong>
                  <div className="meta">{p.active ? "Visible" : "Oculto"}</div>
                </div>
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
