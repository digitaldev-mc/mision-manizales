type EventItem = {
  id: string;
  title: string;
  date: Date;
  place: string;
  description: string;
};

function fmtEventDate(d: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

export function EncuentrosSection({ events }: { events: EventItem[] }) {
  return (
    <section className="encuentros" id="encuentros">
      <div className="blob blob-anim" />
      <div className="wrap">
        <div className="encuentros-head reveal">
          <div>
            <span className="kicker">Agenda ciudadana</span>
            <h2>Próximos encuentros y acciones</h2>
            <p>Convites, ferias y activaciones donde puedes sumarte en persona.</p>
          </div>
        </div>
        <div className="encuentros-track reveal" id="encuentros-track">
          {events.length === 0 ? (
            <div className="encuentros-empty">
              Aún no hay encuentros publicados. El equipo administrativo puede agregarlos desde el
              panel.
            </div>
          ) : (
            events.map((ev) => (
              <div className="encuentro-card" key={ev.id}>
                <span className="fecha">{fmtEventDate(ev.date)}</span>
                <h3>{ev.title}</h3>
                {ev.place ? <p className="lugar">{ev.place}</p> : null}
                <p>{ev.description}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
