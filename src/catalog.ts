import readXlsxFile from "read-excel-file/browser";

export type Difficulty = "Fácil" | "Medio" | "Medio-difícil" | "Difícil" | "[por confirmar]";

export type Game = {
  name: string;
  image: string;
  minPlayers: number | null;
  maxPlayers: number | null;
  players: string;
  minMinutes: number | null;
  maxMinutes: number | null;
  time: string;
  difficulty: Difficulty;
  genres: string[];
  age: string;
  description: string;
};

export type MenuItem = {
  category: string;
  name: string;
  description: string;
  price: string;
  detail: string;
};

export type CatalogLoadResult = {
  games?: Game[];
  menu?: MenuItem[];
  gamesError?: unknown;
  menuError?: unknown;
};

const GAME_COLUMNS = [
  "name",
  "image",
  "minPlayers",
  "maxPlayers",
  "players",
  "minMinutes",
  "maxMinutes",
  "time",
  "difficulty",
  "genres",
  "age",
  "description",
];
const MENU_COLUMNS = ["category", "name", "description", "price", "detail"];
const DIFFICULTIES: Difficulty[] = ["Fácil", "Medio", "Medio-difícil", "Difícil", "[por confirmar]"];

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function requiredText(value: unknown, column: string, sheet: string, row: number): string {
  const result = text(value);
  if (!result) throw new Error(`Falta "${column}" en la hoja "${sheet}", fila ${row}.`);
  return result;
}

function optionalNumber(value: unknown, column: string, fileName: string, row: number): number | null {
  const input = text(value);
  if (!input) return null;
  const result = Number(input);
  if (!Number.isFinite(result)) throw new Error(`"${column}" debe ser un número en "${fileName}", fila ${row}.`);
  return result;
}

type WorkbookSheets = Awaited<ReturnType<typeof readXlsxFile>>;

function readRows(sheets: WorkbookSheets, fileName: string, sheetName: string, columns: string[]): Record<string, unknown>[] {
  const sheet = sheets.find((item) => item.sheet === sheetName) ?? sheets[0];
  if (!sheet) throw new Error(`El Excel "${fileName}" no contiene hojas.`);

  const [headerRow, ...dataRows] = sheet.data;
  if (!headerRow) throw new Error(`La primera hoja del Excel "${fileName}" está vacía.`);

  const headers = headerRow.map(text);
  const missingColumns = columns.filter((column) => !headers.includes(column));
  if (missingColumns.length) {
    throw new Error(`Al Excel "${fileName}" le faltan estas columnas: ${missingColumns.join(", ")}.`);
  }

  return dataRows
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])))
    .filter((row) => Object.values(row).some((value) => text(value)));
}

export async function parseMenu(buffer: ArrayBuffer): Promise<MenuItem[]> {
  const menuSheets = await readXlsxFile(buffer);
  const menu = readRows(menuSheets, "Menu.xlsx", "MenuMesaDragon", MENU_COLUMNS).map((row, index) => {
    const rowNumber = index + 2;
    return {
      category: requiredText(row.category, "category", "Menu.xlsx", rowNumber),
      name: requiredText(row.name, "name", "Menu.xlsx", rowNumber),
      description: text(row.description),
      price: text(row.price),
      detail: text(row.detail),
    };
  });
  if (!menu.length) throw new Error('El Excel "Menu.xlsx" no tiene productos.');
  return menu;
}

export async function parseGames(buffer: ArrayBuffer): Promise<Game[]> {
  const gameSheets = await readXlsxFile(buffer);
  const games = readRows(gameSheets, "Juegos.xlsx", "Juegos", GAME_COLUMNS).map((row, index) => {
    const rowNumber = index + 2;
    const difficulty = requiredText(row.difficulty, "difficulty", "Juegos.xlsx", rowNumber);
    if (!DIFFICULTIES.includes(difficulty as Difficulty)) {
      throw new Error(`Dificultad no reconocida en "Juegos.xlsx", fila ${rowNumber}: "${difficulty}".`);
    }

    return {
      name: requiredText(row.name, "name", "Juegos.xlsx", rowNumber),
      image: text(row.image),
      minPlayers: optionalNumber(row.minPlayers, "minPlayers", "Juegos.xlsx", rowNumber),
      maxPlayers: optionalNumber(row.maxPlayers, "maxPlayers", "Juegos.xlsx", rowNumber),
      players: text(row.players),
      minMinutes: optionalNumber(row.minMinutes, "minMinutes", "Juegos.xlsx", rowNumber),
      maxMinutes: optionalNumber(row.maxMinutes, "maxMinutes", "Juegos.xlsx", rowNumber),
      time: text(row.time),
      difficulty: difficulty as Difficulty,
      genres: text(row.genres).split(/[,;\n]/).map((genre) => genre.trim()).filter(Boolean),
      age: text(row.age),
      description: text(row.description),
    };
  });
  if (!games.length) throw new Error('El Excel "Juegos.xlsx" no tiene juegos.');
  return games;
}

async function loadFile<T>(baseUrl: string, fileName: string, parse: (buffer: ArrayBuffer) => Promise<T>): Promise<T> {
  const response = await fetch(`${baseUrl}${fileName}`);
  if (!response.ok) throw new Error(`No se pudo cargar ${fileName} (HTTP ${response.status}).`);
  return parse(await response.arrayBuffer());
}

export async function loadCatalog(baseUrl: string): Promise<CatalogLoadResult> {
  const [menuResult, gamesResult] = await Promise.allSettled([
    loadFile(baseUrl, "Menu.xlsx", parseMenu),
    loadFile(baseUrl, "Juegos.xlsx", parseGames),
  ]);
  return {
    ...(menuResult.status === "fulfilled" ? { menu: menuResult.value } : { menuError: menuResult.reason }),
    ...(gamesResult.status === "fulfilled" ? { games: gamesResult.value } : { gamesError: gamesResult.reason }),
  };
}
