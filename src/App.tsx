import { useEffect, useMemo, useRef, useState } from "react";
import { initializeAnalyticsTracking, trackBookingRequest } from "./analytics";
import { loadCatalog, type Difficulty, type Game, type MenuItem } from "./catalog";

const WHATSAPP_NUMBER = "59176187558";
const MAPS_URL = "https://maps.app.goo.gl/MJPkHdhoheGRVc2w5";
const CATALOG_ERROR_MESSAGE = "Ocurrió algo mal.";
const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;

const HERO_IMAGES = [
  "/images/WhatsApp Image 2026-10-23 at 12.28.19 AM.jpeg",
  "/images/WhatsApp Image 2026-10-23 at 12.28.19 AM (3).jpeg",
  "/images/WhatsApp Image 2026-10-23 at 12.28.19 AM (2).jpeg",
  "/images/WhatsApp Image 2026-10-23 at 12.32.49 AM.jpeg",
  "/images/WhatsApp Image 2026-10-23 at 12.33.52 AM.jpeg",
].map(assetUrl);
type GoogleReview = {
  author: string;
  rating: number;
  date: string;
  text: string;
};

const reviewsData: GoogleReview[] = [
  { author: "Hugo Areco", rating: 5, date: "Hace un meses", text: "Precios modicos la verdad, si eres alguien de cultura este lugar esta muy bueno para pasar el rato y lo mejor es que puede ser tan divertido como relajante dependiendo de tu compañía Su pizza es muy buena aunque lo que más destaca son sus galletas,hay tantos juegos que te diviertiras años" },
  { author: "Gerardo Aguirre", rating: 5, date: "Hace 3 meses", text: "Buenisimo. Se me hace muy barato para algo tan lindo. 10/10 el profe se sabe y te enseña todos los juegos. La comida rica. Buen precio y sobre todo el ambiente es muy lindo. De mis lugares favoritos espero siempre les vaya bien." }
];

const SOCIAL_URLS = {
  Instagram: "https://www.instagram.com/mesadragontja?mdxt=MWRlcGoybHAyZjYzcQ==",
  TikTok: "https://www.tiktok.com/@mesa.dragn?_r=1&_t=ZS-9AWHUUgaQar",
  Facebook: "https://www.facebook.com/share/1Fre4ENvcF/",
  Comunidades: "https://chat.whatsapp.com/C9f2ZhHgXFL1rg8Sihe8ih",
};

const difficultyInfo: Record<Difficulty, string> = {
  Fácil: "5 min de explicación",
  Medio: "~15 min de explicación",
  "Medio-difícil": "Pide práctica",
  Difícil: "Recomendado para expertos",
  "[por confirmar]": "Información por confirmar",
};

const difficultyClass: Record<Difficulty, string> = {
  Fácil: "easy", Medio: "medium", "Medio-difícil": "mediumHard", Difícil: "hard", "[por confirmar]": "unknown",
};

function normalizeText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function Icon({ name, size = 20 }: { name: "users" | "clock" | "book" | "dice" | "map" | "search" | "calendar" | "food" | "close" | "chevron"; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    users: <><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3.4 2.4-6 6-6s6 2.6 6 6M16 4.5a3 3 0 0 1 0 5.8M17 14c2.5.4 4 2.5 4 5" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    book: <><path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H11v17H7.5A3.5 3.5 0 0 0 4 22zM20 5.5A3.5 3.5 0 0 0 16.5 2H13v17h3.5A3.5 3.5 0 0 1 20 22z" /></>,
    dice: <><rect x="3" y="3" width="18" height="18" rx="4" /><circle cx="8" cy="8" r="1" fill="currentColor" /><circle cx="16" cy="16" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /></>,
    map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4M16 3v4M3 10h18" /></>,
    food: <><path d="M7 3v8M4 3v5c0 2 1 3 3 3s3-1 3-3V3M7 11v10M16 3c3 2 3 7 0 9v9M16 3v9" /></>,
    close: <><path d="m5 5 14 14M19 5 5 19" /></>,
    chevron: <><path d="m8 10 4 4 4-4" /></>,
  };
  return <svg aria-hidden="true" className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function Star({ small = false }: { small?: boolean }) {
  return <span className={`star ${small ? "starSmall" : ""}`} aria-hidden="true"><span>✦</span></span>;
}

function Brand({ compact = false }: { compact?: boolean }) {
  return <div className={`brand ${compact ? "brandCompact" : ""}`}><span><strong>Mesa Dragón</strong>{!compact && <small>Café Lúdico</small>}</span></div>;
}

function Button({ children, variant = "primary", onClick, disabled = false, type = "button", className = "" }: { children: React.ReactNode; variant?: "primary" | "secondary" | "quiet"; onClick?: () => void; disabled?: boolean; type?: "button" | "submit"; className?: string }) {
  return <button type={type} disabled={disabled} onClick={onClick} className={`button ${variant} ${className}`}>{children}</button>;
}

function Chip({ children, active = false, onClick, className = "" }: { children: React.ReactNode; active?: boolean; onClick?: () => void; className?: string }) {
  return <button type="button" className={`chip ${active ? "active" : ""} ${className}`} onClick={onClick}>{children}</button>;
}

function SectionTitle({ eyebrow, children, light = false }: { eyebrow: string; children: React.ReactNode; light?: boolean }) {
  return <div className={`sectionTitle ${light ? "light" : ""}`}><span>{eyebrow}</span><h2>{children}</h2><div className="titleRule"><i /><Star small /><i /></div></div>;
}

function getOpenStatus() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/La_Paz", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(now);
  const day = parts.find((p) => p.type === "weekday")?.value ?? "";
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  const isMonday = day === "Mon";
  const current = hour * 60 + minute;
  const open = !isMonday && current >= 16 * 60 && current < 23 * 60;
  if (open) return { open: true, label: "Abierto ahora · cierra a las 23:00" };
  if (isMonday) return { open: false, label: "Cerrado · abre martes a las 16:00" };
  if (current < 16 * 60) return { open: false, label: "Cerrado · abre hoy a las 16:00" };
  return { open: false, label: day === "Sun" ? "Cerrado · abre martes a las 16:00" : "Cerrado · abre mañana a las 16:00" };
}

function App() {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingGame, setBookingGame] = useState<string[]>([]);
  const bookingHistoryOpen = useRef(false);
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState("Todos");
  const [players, setPlayers] = useState("Todos");
  const [duration, setDuration] = useState("Todas");
  const [genre, setGenre] = useState("Todos");
  const [games, setGames] = useState<Game[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [gamesError, setGamesError] = useState(false);
  const [menuError, setMenuError] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [menuTab, setMenuTab] = useState("Pizzas");
  const [heroImageIndex, setHeroImageIndex] = useState(0);
  const status = getOpenStatus();
  const menuCategories = useMemo(() => [...new Set(menuItems.map((item) => item.category))], [menuItems]);
  const genres = [...new Set(games.flatMap((game) => game.genres).filter((item) => !item.startsWith("[")))];

  useEffect(() => initializeAnalyticsTracking(), []);

  useEffect(() => {
    let active = true;
    loadCatalog(import.meta.env.BASE_URL)
      .then(({ games: catalogGames, gamesError: gameLoadError, menu, menuError: menuLoadError }) => {
        if (!active) return;
        if (catalogGames) {
          setGames(catalogGames);
        } else {
          console.error("No se pudo leer el archivo de juegos Juegos.xlsx.", gameLoadError);
          setGamesError(true);
        }
        if (menu) {
          setMenuItems(menu);
          setMenuTab((current) => menu.some((item) => item.category === current) ? current : menu[0].category);
        } else {
          console.error("No se pudo leer el archivo del menú Menu.xlsx.", menuLoadError);
          setMenuError(true);
        }
        setCatalogLoading(false);
      })
      .catch((error: unknown) => {
        if (!active) return;
        console.error("No se pudo cargar el catálogo de Excel.", error);
        setGamesError(true);
        setMenuError(true);
        setCatalogLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const header = document.querySelector('.header');
      if (!header) return;
      if (window.scrollY > 30) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      if (bookingHistoryOpen.current) {
        bookingHistoryOpen.current = false;
        setBookingOpen(false);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setHeroImageIndex((current) => (current + 1) % HERO_IMAGES.length);
    }, 2000);
    return () => window.clearInterval(intervalId);
  }, []);

  const filteredGames = useMemo(() => games.filter((game) => {
    const matchesQuery = normalizeText(game.name).includes(normalizeText(query));
    const matchesDifficulty = difficulty === "Todos" || game.difficulty === difficulty;
    const playerRanges: Record<string, [number, number]> = { "1–4": [1, 4], "5–8": [5, 8], "9–12": [9, 12] };
    const range = playerRanges[players];
    const matchesPlayers = players === "Todos" || (game.minPlayers !== null && game.maxPlayers !== null && game.minPlayers <= range[1] && game.maxPlayers >= range[0]);
    const matchesDuration = duration === "Todas" || (game.minMinutes !== null && game.maxMinutes !== null && (
      (duration === "<30" && game.minMinutes < 30) ||
      (duration === "30–60" && game.minMinutes <= 60 && game.maxMinutes >= 30) ||
      (duration === ">60" && game.maxMinutes > 60)
    ));
    const matchesGenre = genre === "Todos" || game.genres.includes(genre);
    return matchesQuery && matchesDifficulty && matchesPlayers && matchesDuration && matchesGenre;
  }), [games, query, difficulty, players, duration, genre]);

  const openBooking = (game?: string) => {
    if (game) setBookingGame((current) => current.includes(game) ? current : [...current, game].slice(0, 3));
    setSelectedGame(null);
    if (!bookingHistoryOpen.current) {
      window.history.pushState({ ...window.history.state, bookingModal: true }, "");
      bookingHistoryOpen.current = true;
    }
    setBookingOpen(true);
  };

  const closeBooking = () => {
    if (bookingHistoryOpen.current) {
      bookingHistoryOpen.current = false;
      if (window.history.state?.bookingModal) window.history.back();
    }
    setBookingOpen(false);
  };

  const resetFilters = () => { setQuery(""); setDifficulty("Todos"); setPlayers("Todos"); setDuration("Todas"); setGenre("Todos"); };

  return <div className="appShell">
    <header className="header">
      <a href="#inicio" className="logoLink" aria-label="Mesa Dragón, inicio">
        <span style={{ fontFamily: '"Pirata One", serif', fontSize: '20px', fontWeight: 'bold' }}>Mesa Dragón</span>
      </a>
      <nav aria-label="Navegación principal">
        <a href="#juegos">Juegos</a><a href="#menu">Menú</a><a href="#experiencia">Experiencia</a><a href="#ubicacion">Ubicación</a>
      </nav>
      <Button onClick={() => openBooking()} className="headerButton">Reservar mesa</Button>
    </header>

    <main>
      <section id="inicio" className="hero">
        <div className="heroImage" role="img" aria-label="Personas compartiendo una partida de mesa en un café cálido">
          {HERO_IMAGES.map((image, index) => <div
            className={`heroBackground ${heroImageIndex === index ? "active" : ""}`}
            style={{ backgroundImage: `url("${image}")` }}
            key={image}
            aria-hidden="true"
          />)}
          <div className="heroLogo"><img src={assetUrl("/LOGISTICA.png")} alt="Logo Mesa Dragón" className="dragonMarkImage" /></div>
          <span className={`status ${status.open ? "isOpen" : ""}`}><i />{status.label}</span>
        </div>
        <div className="heroContent">
          <span className="eyebrow">Tu nueva mesa favorita</span>
          <h1>Te enseñamos<br />a jugar.</h1>
          <p className="heroPromise">Juega, descubre y comparte.</p>
          <p>Más de 260 juegos de mesa, amigos y comida en un solo lugar</p>
          <Button onClick={() => openBooking()}>Reservar una mesa</Button>
          <div className="heroLinks"><a href="#juegos">Ver juegos <span>↓</span></a><a href="#menu">Ver menú <span>↓</span></a></div>
        </div>
      </section>

      <section id="experiencia" className="experience section">
        <SectionTitle eyebrow="La experiencia" light>Tu aventura empieza aquí</SectionTitle>
        <div className="featureList">
          <article><div className="featureIcon"><Icon name="book" size={26} /></div><div><h3>Te enseñamos a jugar</h3><p>Nuestros escuderos te enseñan las reglas para que solo tengas que disfrutar.</p></div></article>
          <article><div className="featureIcon"><Icon name="users" size={26} /></div><div><h3>Para grupos de dos o más personas</h3><p>Parejas, familia o amigos: preparamos la mesa para tu grupo.</p></div></article>
          <article><div className="featureIcon"><Icon name="clock" size={26} /></div><div><h3>Rápidas, estratégicas o largas</h3><p>Desde partidas de 15 minutos hasta estrategia compleja para toda la noche.</p></div></article>
          <article><div className="featureIcon"><Icon name="dice" size={26} /></div><div><h3>Juegos y campañas de rol</h3><p>Grupos de 3 a 5 personas, consulta por nuestras mesas o campañas disponibles.</p></div></article>
        </div>
      </section>

      <section id="juegos" className="section gamesSection">
        <SectionTitle eyebrow="Nuestros juegos">Son sin límites de tiempo</SectionTitle>
        <p className="sectionIntro">
  Accede a toda nuestra ludoteca:<br />
  • Pase libre: 10 Bs / persona (juega todo lo que quieras)<br />
  <strong>Paga por QR o efectivo en el local</strong>
</p>
        
        <Filter label="Dificultad" options={["Todos", "Fácil", "Medio", "Medio-difícil", "Difícil"]} value={difficulty} onChange={setDifficulty} />
        <Filter label="Jugadores" options={["Todos", "1–4", "5–8", "9–12"]} value={players} onChange={setPlayers} />
        <span>ㅤ</span>
        <label className="search"><Icon name="search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre..." /></label>
        
        <div className="resultCount"><span>{filteredGames.length} {filteredGames.length === 1 ? "juego" : "juegos"}</span><i /></div>
        <div className="gameList">
          {gamesError ? <p className="catalogError" role="alert">{CATALOG_ERROR_MESSAGE}</p> : catalogLoading ? <p role="status">Cargando juegos...</p> : filteredGames.map((game) => <button type="button" className="gameCard" key={game.name} onClick={() => setSelectedGame(game)}>
            <div className="gameArt">
              {game.image ? (
                <img src={assetUrl(game.image)} alt={game.name} className="gameThumb" />
              ) : (
              <Star />
              )}
            </div>
            <div className="gameMain"><h3>{game.name}</h3><div className="gameMeta">
              <span className={`difficulty ${difficultyClass[game.difficulty]}`}><i />{game.difficulty}</span>
              <span><Icon name="users" size={16} />{game.players}</span>
              <span><Icon name="clock" size={16} />{game.time}</span>
            </div></div>
            <span className="cardArrow">›</span>
          </button>)}
          {!filteredGames.length && <div className="empty"><Star /><h3>Ningún juego cruza esos caminos</h3><p>Prueba con menos filtros para descubrir otra partida.</p><Button variant="secondary" onClick={resetFilters}>Restablecer filtros</Button></div>}
        </div>
      </section>

      <section id="menu" data-analytics-section={`menu_${normalizeText(menuTab).replace(/\s+/g, "_")}`} className="section menuSection">
        <SectionTitle eyebrow="La cocina">Nuestro menú</SectionTitle>
        <p className="sectionIntro">Hecho para compartir sin abandonar la partida.</p>
        <div className="scrollChips">{menuCategories.map((tab) => <Chip key={tab} active={menuTab === tab} onClick={() => setMenuTab(tab)}>{tab}</Chip>)}</div>
        <div className="menuList">
          {menuError ? <p className="catalogError" role="alert">{CATALOG_ERROR_MESSAGE}</p> : catalogLoading ? <p role="status">Cargando menú...</p> : menuItems.filter((item) => item.category === menuTab).map(({ name, description, price, detail }, index) => <article className="menuCard" key={`${menuTab}-${name}-${detail}-${price}-${index}`}>
            <div className="menuCopy"><h3>{name}</h3><p>{description}</p>{detail && <span className="foodTag">{detail}</span>}</div><strong>{price}</strong>
          </article>)}
        </div>
        <p className="allergy"><span>!</span> Consulta por alergias. Con gusto te ayudamos.</p>
      </section>

      <section className="reviewsSection section" data-analytics-section="resenas" aria-label="Reseñas de Google Maps">
        <SectionTitle eyebrow="Reseñas de Google Maps">Lo que dicen nuestros aventureros</SectionTitle>
        <div className="googleRating" aria-label="Valoración de Google Maps: 4.8 de 5 estrellas">
          <span aria-hidden="true">⭐</span> 4.8 en Google Maps
        </div>
        {reviewsData.length ? <div className="reviewsGrid">
          {reviewsData.map((review, index) => <ReviewCard review={review} key={`${review.author}-${review.date}-${index}`} />)}
        </div> : <p className="reviewsEmpty">Pronto compartiremos aquí las opiniones de nuestros aventureros.</p>}
        <a className="button primary reviewsButton" href={"https://www.google.com/maps/place/Mesa+Drag%C3%B3n+Caf%C3%A9+L%C3%BAdico/@-21.5314791,-64.7310614,17z/data=!4m18!1m9!3m8!1s0x9406395b99ef60fd:0x8a2bcc2a297b7f00!2zTWVzYSBEcmFnw7NuIENhZsOpIEzDumRpY28!8m2!3d-21.5314791!4d-64.7310614!9m1!1b1!16s%2Fg%2F11t_z9dyl4!3m7!1s0x9406395b99ef60fd:0x8a2bcc2a297b7f00!8m2!3d-21.5314791!4d-64.7310614!9m1!1b1!16s%2Fg%2F11t_z9dyl4!18m1!1e1?entry=ttu&g_ep=EgoyMDI2MTAxOS4wIKXMDSoASAFQAw%3D%3D"} target="_blank" rel="noreferrer">
          Ver más opiniones en Google Maps
        </a>
      </section>

      <section id="ubicacion" className="section locationSection">
        <SectionTitle eyebrow="Ven a jugar">Encuentra tu mesa</SectionTitle>
        <div className="locationCard">
          <div className="mapPattern"><Icon name="map" size={42} /><span>Mesa Dragón</span></div>
          <div className="locationDetails">
            <div><Icon name="clock" /><p><strong>Martes a domingo</strong><br />16:00–23:00<br /><small>Cerramos los lunes</small></p></div>
            <div><Icon name="map" /><p><strong>Calle Colón</strong><br />entre Domingo Paz y Av. Potosí</p></div>
            <a className="button secondary" href={MAPS_URL} target="_blank" rel="noreferrer">Ver en Google Maps</a>
          </div>
        </div>
        <p className="followLabel">Sigue la aventura</p>
        <div className="socials">{Object.entries(SOCIAL_URLS).map(([name, url]) => <a href={url} target="_blank" rel="noreferrer" key={name}>{name}</a>)}</div>
        <Button onClick={() => openBooking()}>Reservar mesa por WhatsApp</Button>
      </section>
    </main>

    <footer><Star /><strong>Mesa Dragón</strong><span>Café lúdico</span><p>© 2026 Todos los derechos reservados.</p></footer>

    {selectedGame && <GameSheet game={selectedGame} onClose={() => setSelectedGame(null)} onBook={() => openBooking(selectedGame.name)} />}
    {bookingOpen && <BookingSheet games={games} selectedGames={bookingGame} setSelectedGames={setBookingGame} onClose={closeBooking} />}
  </div>;
}

function Filter({ label, options, value, onChange, suffix = "" }: { label: string; options: string[]; value: string; onChange: (value: string) => void; suffix?: string }) {
  return <div className="filter"><span>{label}</span><div className="scrollChips">{options.map((option) => <Chip key={option} active={value === option} onClick={() => onChange(option)}>{option}{option !== "Todos" && option !== "Todas" ? suffix : ""}</Chip>)}</div></div>;
}

function ReviewCard({ review }: { review: GoogleReview }) {
  const [expanded, setExpanded] = useState(false);
  return <article className="reviewCard">
    <div className="reviewCardHeader">
      <strong>{review.author}</strong>
      <time>{review.date}</time>
    </div>
    <div className="reviewStars" aria-label={`${review.rating} de 5 estrellas`}>
      {"★".repeat(Math.max(0, Math.min(5, review.rating)))}
    </div>
    <p className={`reviewText ${expanded ? "expanded" : ""}`}>{review.text}</p>
    <button className="reviewExpandButton" type="button" aria-expanded={expanded} onClick={() => setExpanded((current) => !current)}>
      {expanded ? "Ver menos" : "Ver más"}
    </button>
  </article>;
}

function ModalFrame({ children, onClose, className = "", analyticsSection }: { children: React.ReactNode; onClose: () => void; className?: string; analyticsSection?: string }) {
  const pointerStart = useRef<{ pointerId: number; x: number; y: number } | null>(null);
  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", close);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", close); document.body.style.overflow = previous; };
  }, [onClose]);
  const startDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    pointerStart.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const finishDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start || start.pointerId !== event.pointerId) return;
    const deltaY = event.clientY - start.y;
    const deltaX = Math.abs(event.clientX - start.x);
    if (deltaY >= 100 && deltaY > deltaX * 1.2) onClose();
  };
  return <div className="modalBackdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <div className={`sheet ${className}`} role="dialog" aria-modal="true" data-analytics-section={analyticsSection}><div className="sheetHandle" onPointerDown={startDrag} onPointerUp={finishDrag} onPointerCancel={() => { pointerStart.current = null; }} aria-label="Arrastra hacia abajo para cerrar" /><button className="closeButton" onClick={onClose} aria-label="Cerrar"><Icon name="close" /></button>{children}</div>
  </div>;
}

function GameSheet({ game, onClose, onBook }: { game: Game; onClose: () => void; onBook: () => void }) {
  return <ModalFrame onClose={onClose} className="gameSheet" analyticsSection={`juego_${normalizeText(game.name).replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}`}>
    <div className="sheetGameArt"><Star /></div><span className="eyebrow">Sobre el juego</span><h2>{game.name}</h2>
    <div className="detailGrid">
      <div><span>Dificultad</span><strong className={`difficulty ${difficultyClass[game.difficulty]}`}><i />{game.difficulty}</strong><small>{difficultyInfo[game.difficulty]}</small></div>
      <div><span>Jugadores</span><strong><Icon name="users" />{game.players}</strong></div>
      <div><span>Duración</span><strong><Icon name="clock" />{game.time}</strong></div>
      <div><span>Edad</span><strong>{game.age}</strong></div>
    </div>
    <span className="detailLabel">Géneros</span><div className="genreChips">{game.genres.map((item) => <span key={item}>{item}</span>)}</div>
    <span className="detailLabel">La aventura</span><p className="gameDescription">{game.description}</p>
    <Button onClick={onBook}>Reservar mesa con este juego</Button>
  </ModalFrame>;
}

function BookingSheet({ games, selectedGames, setSelectedGames, onClose }: { games: Game[]; selectedGames: string[]; setSelectedGames: React.Dispatch<React.SetStateAction<string[]>>; onClose: () => void }) {
  const today = new Date();
  const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split("T")[0];
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [people, setPeople] = useState(2);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [timeError, setTimeError] = useState("");
  const [gameQuery, setGameQuery] = useState("");
  const [comments, setComments] = useState("");
  const [dateError, setDateError] = useState("");
  const [sent, setSent] = useState(false);
  const valid = Boolean(name.trim() && date && time && !dateError && !timeError);


  
  const handleDate = (value: string) => {
    setDate(value);
    const chosen = new Date(`${value}T12:00:00`);
    setDateError(chosen.getDay() === 1 ? "Cerramos los lunes. Elige otro día." : "");
  };
  const handleTime = (value: string) => {
    setTime(value);
    setTimeError(value && (value < "16:00" || value > "23:00") ? "Elige una hora entre 16:00 y 23:00." : "");
  };
  const toggleGame = (game: string) => setSelectedGames((current) => current.includes(game) ? current.filter((item) => item !== game) : current.length < 3 ? [...current, game] : current);
  const bookingGames = games.filter((game) => game.name !== "Bamboo" && normalizeText(game.name).includes(normalizeText(gameQuery.trim())));
  const submit = () => {
    if (!valid) return;
    const message = `🐉 *NUEVA RESERVA - MESA DRAGÓN* 🎲

👤 *Nombre:* ${name}
👥 *Personas:* ${people}
📅 *Fecha:* ${date}
⏰ *Hora:* ${time} hs

🎮 *Juegos de preferencia:*
${selectedGames.length ? selectedGames.map(game => `  • ${game}`).join("\n") : "  • [Por elegir en el lugar]"}

💬 *Comentarios / Notas:*
${comments ? `  ${comments}` : "  [Sin comentarios]"}

¡Quedo a la espera de su confirmación! 🙌`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
    trackBookingRequest(people, selectedGames.length);
    setSent(true);
  };

  return <ModalFrame onClose={onClose} className="bookingSheet" analyticsSection="reserva">
    {sent ? <div className="successState"><Star /><span className="eyebrow">Solicitud enviada</span><h2>Listo, revisa WhatsApp para confirmar tu reserva</h2><div className="bookingSummary"><p><span>Nombre</span><strong>{name}</strong></p><p><span>Mesa</span><strong>{people} personas · {date} · {time}</strong></p><p><span>Juegos</span><strong>{selectedGames.join(", ") || "[por elegir]"}</strong></p></div><Button onClick={onClose}>Cerrar</Button></div> :
      <>
        <span className="eyebrow">Prepara la aventura</span><h2>Reserva tu mesa</h2><p className="sheetIntro">Completa los datos y te llevaremos a WhatsApp para confirmar.</p>
        <div className="formGrid">
          <label><span>Nombre *</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Tu nombre" /></label>
          
          <div className="peopleField"><span>Personas *</span><div><button onClick={() => setPeople(Math.max(2, people - 1))} disabled={people === 2} aria-label="Quitar una persona">−</button><strong>{people}<small>{people >= 9 ? " grupo" : ""}</small></strong><button onClick={() => setPeople(Math.min(12, people + 1))} disabled={people === 12} aria-label="Añadir una persona">+</button></div></div>
          <label><span>Fecha *</span><input type="date" min={localToday} value={date} onChange={(event) => handleDate(event.target.value)} />{dateError && <small className="error">{dateError}</small>}</label>
        </div>
        <div className="bookingBlock"><span>Hora *</span><div className="timeChips">{["16:00", "17:30", "19:00", "20:30"].map((item) => <Chip active={time === item} onClick={() => handleTime(item)} key={item}>{item} hs</Chip>)}</div><label className="customTime"><span>O elige otra hora</span><input className="bookingTimeInput" type="time" min="16:00" max="23:00" value={time} onChange={(event) => handleTime(event.target.value)} aria-describedby={timeError ? "booking-time-error" : undefined} /></label>{timeError && <small id="booking-time-error" className="error">{timeError}</small>}</div>
        <div className="bookingBlock"><span>Juegos para tu mesa <small>(opcional, hasta 3)</small></span><label className="bookingSearchLabel" htmlFor="booking-game-search">Busca tu juego</label><label className="search bookingGameSearch"><Icon name="search" /><input id="booking-game-search" value={gameQuery} onChange={(event) => setGameQuery(event.target.value)} placeholder="Buscar un juego..." /></label><div className="gameSelect">{bookingGames.map((game) => <Chip key={game.name} active={selectedGames.includes(game.name)} onClick={() => toggleGame(game.name)} className={!selectedGames.includes(game.name) && selectedGames.length >= 3 ? "limitReached" : ""}>{game.name}</Chip>)}{!bookingGames.length && <p className="gameSearchEmpty">No encontramos juegos con ese nombre.</p>}</div></div>
        <label><span>Comentarios <small>(opcional)</small></span><textarea value={comments} onChange={(event) => setComments(event.target.value)} placeholder="Cumpleaños, accesibilidad, juego favorito..." rows={3} /></label>
        <div className="bookingSummary"><p><span>Tu mesa</span><strong>{people} personas{date ? ` · ${date}` : ""}{time ? ` · ${time}` : ""}</strong></p><p><span>Juegos</span><strong>{selectedGames.join(", ") || "[por elegir]"}</strong></p></div>
        <Button onClick={submit} disabled={!valid}>Enviar solicitud por WhatsApp</Button>
        {!valid && <p className="requiredNote">Completa nombre, fecha y hora para continuar.</p>}
        <p className="bookingTerms">💡 La confirmación se realiza por WhatsApp y el pago se efectúa directamente en el local  (QR y/o efectivo).</p>
      </>}
  </ModalFrame>;
}

export default App;
