import initSqlJs from 'sql.js';
import type { Database, SqlJsStatic } from 'sql.js';

const STORAGE_KEY = 'frases_epicas_sqlite_v5';
export const ACTIVE_USER_STORAGE_KEY = 'frases_epicas_active_username';

export class DatabaseService {
  private static db: Database | null = null;

  public static async getConnection(): Promise<Database> {
    if (!this.db) {
      const win = window as unknown as {
        initSqlJs?: (config?: { locateFile?: (file: string) => string }) => Promise<SqlJsStatic>;
      };

      const loader = win.initSqlJs ?? initSqlJs;

      const SQL = await loader({
        locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
      });

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const u8 = new Uint8Array(JSON.parse(saved));
          this.db = new SQL.Database(u8);
          this.initializeSchema();
        } catch {
          this.db = new SQL.Database();
          this.initializeSchema();
          this.persist();
        }
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

  public static async resetDatabase(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
    this.db = null;
    await this.getConnection();
  }

  private static initializeSchema(): void {
    if (!this.db) return;

    this.db.run(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        xp INTEGER NOT NULL DEFAULT 150,
        nivel INTEGER NOT NULL DEFAULT 1
      );
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS frases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        texto TEXT NOT NULL,
        personaje TEXT NOT NULL,
        obra TEXT NOT NULL,
        categoria TEXT NOT NULL,
        votos INTEGER NOT NULL DEFAULT 1,
        creado_por TEXT NOT NULL DEFAULT 'Juan Hernandez'
      );
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS votos_por_frase (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        frase_id INTEGER NOT NULL,
        votos_usados INTEGER NOT NULL DEFAULT 0,
        ultimo_reset_timestamp INTEGER NOT NULL DEFAULT 0,
        UNIQUE(username, frase_id)
      );
    `);

    const userCountRes = this.db.exec('SELECT COUNT(*) FROM usuarios');
    const userCount = userCountRes[0].values[0][0] as number;

    if (userCount === 0) {
      this.db.run(
        `INSERT INTO usuarios (username, password, xp, nivel) VALUES ('Juan Hernandez', '123', 200, 1);`
      );
    }

    const frasesCountRes = this.db.exec('SELECT COUNT(*) FROM frases');
    const frasesCount = frasesCountRes[0].values[0][0] as number;

    if (frasesCount === 0) {
      this.db.run(`
        INSERT INTO frases (texto, personaje, obra, categoria, votos, creado_por) VALUES
        ('La guerra. La guerra nunca cambia.', 'Narrador', 'Fallout', 'Videojuegos', 120, 'Juan Hernandez'),
        ('El principio es el fin y el fin es el principio.', 'Adam', 'Dark', 'Series/Cine', 98, 'Juan Hernandez'),
        ('Sin sacrificio no hay victoria.', 'Rey Palido', 'Hollow Knight', 'Videojuegos', 86, 'Juan Hernandez'),
        ('El talento sin trabajo duro no es nada.', 'Cristiano Ronaldo', 'Champions League', 'Deportes', 74, 'Juan Hernandez'),
        ('Yo soy el que llama a la puerta.', 'Walter White', 'Breaking Bad', 'Series/Cine', 63, 'Juan Hernandez'),
        ('Un gran poder conlleva una gran responsabilidad.', 'Tio Ben', 'Spider-Man', 'Series/Cine', 52, 'Juan Hernandez'),
        ('F en el chat para presentar respetos.', 'Soldado Mitchell', 'Call of Duty: AW', 'Cultura/Memes', 39, 'Juan Hernandez'),
        ('La mentalidad no es solo un rasgo, es una disciplina diaria.', 'Kobe Bryant', 'NBA Finals', 'Deportes', 24, 'Juan Hernandez');
      `);
    }
  }
}