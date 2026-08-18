"use client";

type PartnerItem = {
  id: string;
  name: string;
  logoUrl?: string | null;
};

function PartnerLogo({ partner }: { partner: PartnerItem }) {
  return (
    <div className="aliado-chip" title={partner.name}>
      {partner.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={partner.logoUrl} alt={partner.name} className="aliado-logo" />
      ) : (
        <span className="aliado-name">{partner.name}</span>
      )}
    </div>
  );
}

export function AliadosSection({ partners }: { partners: PartnerItem[] }) {
  if (partners.length === 0) {
    return (
      <section className="aliados" id="aliados">
        <div className="wrap">
          <div className="section-head reveal">
            <span className="kicker">Empresas y gremios</span>
            <h2>Aliados que ya se suman</h2>
            <p>Compañías y organizaciones que apoyan a Misión Comparte.</p>
          </div>
          <div className="aliados-empty">Aún no hay aliados publicados.</div>
        </div>
      </section>
    );
  }

  const useMarquee = partners.length > 5;
  const trackItems = useMarquee ? [...partners, ...partners] : partners;

  return (
    <section className="aliados" id="aliados">
      <div className="wrap">
        <div className="section-head reveal">
          <span className="kicker">Empresas y gremios</span>
          <h2>Aliados que ya se suman</h2>
          <p>Compañías y organizaciones que apoyan a Misión Comparte.</p>
        </div>
      </div>
      {useMarquee ? (
        <div className="aliados-marquee reveal" id="aliados-marquee-wrap">
          <div className="aliados-track" id="aliados-track">
            {trackItems.map((p, i) => (
              <PartnerLogo key={`${p.id}-${i}`} partner={p} />
            ))}
          </div>
        </div>
      ) : (
        <div className="wrap">
          <div className={`aliados-grid aliados-grid-${Math.min(partners.length, 5)} reveal`}>
            {partners.map((p) => (
              <PartnerLogo key={p.id} partner={p} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
