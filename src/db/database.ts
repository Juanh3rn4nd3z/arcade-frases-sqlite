import initSqlJs, { Database } from 'sql.js';

const STORAGE_KEY = 'arcade_frases_sqlite_v1';

export class DatabaseService {
  private static db: Database | null = null;

  public static async getConnection(): Promise<Database> {
    if (!this.db) {
      const SQL = await initSqlJs({
        locateFile: (file) => `https://sql.js.org/dist/${file}`
      });

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const u8 = new Uint8Array(JSON.parse(saved));
        this.db = new SQL.Database(u8);
      } else {
        this.db = new SQL.Database();
        this.initializeSchema();
        this.persist();
      }
    }
    return this.db;
  }

  public static persist(): void {
    if (!this.db) return;
    const data = this.db.export();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(data)));
  }

  public static resetDatabase(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.db = null;
  }

  private static initializeSchema(): void {
    if (!this.db) return;

    this.db.run(`
      CREATE TABLE IF NOT EXISTS frases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        texto TEXT NOT NULL,
        autor TEXT NOT NULL,
        origen TEXT NOT NULL,
        categoria TEXT NOT NULL,
        votos INTEGER DEFAULT 1,
        fecha TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const countResult = this.db.exec('SELECT COUNT(*) FROM frases');
    const total = countResult[0].values[0][0] as number;

    if (total === 0) {
      this.db.run(`
        INSERT INTO frases (texto, autor, origen, categoria, votos) VALUES
        ('El principio es el fin y el fin es el principio.', 'Adam / Jonas', 'Dark', 'Series', 48),
        ('Un gran poder conlleva una gran responsabilidad.', 'Tío Ben / Peter Parker', 'Marvel''s Spider-Man', 'Videojuegos', 42),
        ('Sin sacrificio no hay victoria.', 'Rey Pálido', 'Hollow Knight', 'Videojuegos', 39),
        ('No existe tal cosa como la suerte, solo preparación y lectura.', 'Patrick Jane', 'The Mentalist', 'Series', 34),
        ('Yo no estoy atrapado aquí con ustedes, ustedes están atrapados conmigo.', 'Rick Grimes', 'The Walking Dead', 'Series', 31),
        ('Si no crees que eres el mejor, nunca lograrás todo de lo que eres capaz.', 'Cristiano Ronaldo', 'Fútbol Europeo', 'Deportes', 45);
      `);
    }
  }
}