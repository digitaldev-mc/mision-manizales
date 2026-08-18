"use client";

import { EmpanadaGauge } from "./EmpanadaGauge";
import { AliadosSection } from "./AliadosSection";
import { EncuentrosSection } from "./EncuentrosSection";
import { HeroSection } from "./HeroSection";
import { HistoriaSection } from "./HistoriaSection";
import { HistoriasSection } from "./HistoriasSection";
import { ScrollProgress, SiteLoader } from "./SiteLoader";
import { SiteFooter } from "./SiteFooter";
import { SiteNav } from "./SiteNav";
import { TiendaSection } from "./TiendaSection";
import { useScrollReveal } from "./useScrollReveal";

export type HomePageProps = {
  raisedCOP: number;
  donorCount: number;
  historiaImages?: string[];
  historiaTag?: string;
  events: Array<{
    id: string;
    title: string;
    date: string;
    place: string;
    description: string;
  }>;
  stories: Array<{
    id: string;
    title: string;
    videoUrl: string | null;
    description: string;
  }>;
  partners: Array<{ id: string; name: string; logoUrl?: string | null }>;
  products: Array<{
    id: string;
    name: string;
    description: string;
    priceCOP: number;
    imageUrl: string;
    soldOut: boolean;
  }>;
};

export function HomePage({
  raisedCOP,
  donorCount,
  historiaImages,
  historiaTag,
  events,
  stories,
  partners,
  products,
}: HomePageProps) {
  useScrollReveal();

  return (
    <>
      <SiteLoader />
      <ScrollProgress />
      <SiteNav />
      <HeroSection raisedCOP={raisedCOP} donorCount={donorCount} />
      <HistoriaSection images={historiaImages} tag={historiaTag} />
      <EmpanadaGauge />
      <EncuentrosSection
        events={events.map((e) => ({ ...e, date: new Date(e.date) }))}
      />
      <HistoriasSection stories={stories} />
      <AliadosSection partners={partners} />
      <TiendaSection products={products} />
      <SiteFooter />
    </>
  );
}
