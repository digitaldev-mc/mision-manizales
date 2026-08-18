"use client";

import { parseMediaUrl } from "@/lib/media-embed";

type StoryItem = {
  id: string;
  title: string;
  videoUrl: string | null;
  description: string;
};

function StoryMedia({ url, title }: { url: string | null; title: string }) {
  const media = parseMediaUrl(url);

  if (!media) {
    return <div className="video-empty">🎥</div>;
  }

  if (media.type === "youtube" || media.type === "instagram") {
    return (
      <iframe
        src={media.embedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
      />
    );
  }

  return (
    <a
      href={media.externalUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="video-external-link"
    >
      <span>{media.label}</span>
      <small>{media.externalUrl}</small>
    </a>
  );
}

export function HistoriasSection({ stories }: { stories: StoryItem[] }) {
  return (
    <section className="apoyo" id="videos">
      <div className="blob blob-anim" />
      <div className="wrap">
        <div className="section-head reveal">
          <span className="kicker">Rostros de la reconstrucción</span>
          <h2>Historias y causas que estamos apoyando</h2>
          <p>Familias, comerciantes y proyectos que reciben ayuda directa de Misión Manizales.</p>
        </div>
        <div className="video-grid" id="video-grid">
          {stories.length === 0 ? (
            <div className="empty-state">
              Aún no hay historias publicadas.
              <br />
              El equipo administrativo puede agregarlas desde el panel.
            </div>
          ) : (
            stories.map((h) => (
              <div className="video-card reveal in-view" key={h.id}>
                <div className="video-frame">
                  <StoryMedia url={h.videoUrl} title={h.title} />
                </div>
                <div className="body">
                  <h3>{h.title}</h3>
                  <p>{h.description}</p>
                  {h.videoUrl ? (
                    <a
                      href={parseMediaUrl(h.videoUrl)?.externalUrl ?? h.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--azul-esperanza)" }}
                    >
                      Abrir publicación ↗
                    </a>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
