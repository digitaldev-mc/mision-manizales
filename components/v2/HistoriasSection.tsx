type StoryItem = {
  id: string;
  title: string;
  videoUrl: string | null;
  description: string;
};

function youtubeEmbed(url: string | null) {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
}

export function HistoriasSection({ stories }: { stories: StoryItem[] }) {
  return (
    <section className="apoyo" id="videos">
      <div className="blob blob-anim" />
      <div className="wrap">
        <div className="section-head reveal">
          <span className="kicker">Rostros de la reconstrucción</span>
          <h2>Historias y causas que estamos apoyando</h2>
          <p>
            Familias, comerciantes y proyectos que reciben ayuda directa de Misión Manizales.
          </p>
        </div>
        <div className="video-grid" id="video-grid">
          {stories.length === 0 ? (
            <div className="empty-state">
              Aún no hay historias publicadas.
              <br />
              El equipo administrativo puede agregarlas desde el panel.
            </div>
          ) : (
            stories.map((h) => {
              const embed = youtubeEmbed(h.videoUrl);
              return (
                <div className="video-card reveal in-view" key={h.id}>
                  <div className="video-frame">
                    {embed ? (
                      <iframe src={embed} title={h.title} allowFullScreen />
                    ) : (
                      <div className="video-empty">🎥</div>
                    )}
                  </div>
                  <div className="body">
                    <h3>{h.title}</h3>
                    <p>{h.description}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
