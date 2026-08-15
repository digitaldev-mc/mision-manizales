type PartnerItem = {
  id: string;
  name: string;
};

export function AliadosSection({ partners }: { partners: PartnerItem[] }) {
  const chips = partners.map((a) => (
    <div className="aliado-chip" key={a.id}>
      {a.name}
    </div>
  ));

  return (
    <section className="aliados" id="aliados">
      <div className="wrap">
        <div className="section-head reveal">
          <span className="kicker">Empresas y gremios</span>
          <h2>Aliados que ya se suman</h2>
          <p>Compañías y organizaciones que apoyan a Misión Manizales.</p>
        </div>
      </div>
      {partners.length === 0 ? (
        <div className="wrap">
          <div className="aliados-empty">Aún no hay aliados publicados.</div>
        </div>
      ) : (
        <div className="aliados-marquee reveal" id="aliados-marquee-wrap">
          <div className="aliados-track" id="aliados-track">
            {chips}
            {chips}
          </div>
        </div>
      )}
    </section>
  );
}
