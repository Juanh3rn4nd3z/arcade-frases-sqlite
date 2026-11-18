import { DatabaseService, ACTIVE_USER_STORAGE_KEY } from '../db/database';

export const MAX_VOTOS_POR_FRASE = 10;
export const TIEMPO_RECARGA_MS = 2 * 60 * 1000;

export interface UsuarioItem {
  id: number;
  username: string;
  xp: number;
  nivel: number;
}

export interface FraseItem {
  id: number;
  texto: string;
  personaje: string;
  obra: string;
  categoria: string;
  votos: number;
  creado_por: string;
  votos_usados: number;
  ultimo_reset_timestamp: number;
}

export interface ResultadoVoto {
  exito: boolean;
  mensaje?: string;
}

export class FraseModel {
  public static async obtenerUsuarios(): Promise<UsuarioItem[]> {
    const db = await DatabaseService.getConnection();
    const stmt = db.prepare('SELECT id, username, xp, nivel FROM usuarios ORDER BY xp DESC');
    const lista: UsuarioItem[] = [];

    while (stmt.step()) {
      const row = stmt.getAsObject();
      lista.push({
        id: Number(row.id),
        username: String(row.username),
        xp: Number(row.xp),
        nivel: Number(row.nivel)
      });
    }
    stmt.free();
    return lista;
  }

  public static async obtenerUsuarioActivo(): Promise<UsuarioItem> {
    const db = await DatabaseService.getConnection();
    const guardado = localStorage.getItem(ACTIVE_USER_STORAGE_KEY);

    if (guardado) {
      const stmt = db.prepare(
        'SELECT id, username, xp, nivel FROM usuarios WHERE username = ?'
      );

      stmt.bind([guardado]);

      if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();

        return {
          id: Number(row.id),
          username: String(row.username),
          xp: Number(row.xp),
          nivel: Number(row.nivel)
        };
      }

      stmt.free();
      localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
    }

    return {
      id: 0,
      username: 'Invitado',
      xp: 0,
      nivel: 1
    };
  }

  public static async autenticarORegistrar(
    usernameInput: string,
    passwordInput: string,
    modo: 'register' | 'login'
  ): Promise<{ ok: boolean; error?: string; usuario?: UsuarioItem }> {
    const db = await DatabaseService.getConnection();
    const cleanUser = usernameInput.trim();
    const cleanPass = passwordInput.trim();

    if (!cleanUser || !cleanPass) {
      return { ok: false, error: 'Ingresa un usuario y contrasena validos.' };
    }

    const check = db.prepare('SELECT id, username, password, xp, nivel FROM usuarios WHERE LOWER(username) = LOWER(?)');
    check.bind([cleanUser]);
    const existe = check.step();
    const row = existe ? check.getAsObject() : null;
    check.free();

    if (modo === 'login') {
      if (!existe || !row) {
        return { ok: false, error: 'El usuario no existe. Registrate primero.' };
      }
      if (String(row.password) !== cleanPass) {
        return { ok: false, error: 'La contrasena es incorrecta.' };
      }
      const usuario: UsuarioItem = {
        id: Number(row.id),
        username: String(row.username),
        xp: Number(row.xp),
        nivel: Number(row.nivel)
      };
      localStorage.setItem(ACTIVE_USER_STORAGE_KEY, usuario.username);
      return { ok: true, usuario };
    } else {
      if (existe) {
        return { ok: false, error: 'El nombre de usuario ya esta en uso. Inicia sesion.' };
      }
      db.run('INSERT INTO usuarios (username, password, xp, nivel) VALUES (?, ?, 150, 1)', [
        cleanUser,
        cleanPass
      ]);
      DatabaseService.persist();

      const nuevoStmt = db.prepare('SELECT id, username, xp, nivel FROM usuarios WHERE LOWER(username) = LOWER(?)');
      nuevoStmt.bind([cleanUser]);
      nuevoStmt.step();
      const newRow = nuevoStmt.getAsObject();
      nuevoStmt.free();

      const nuevo: UsuarioItem = {
        id: Number(newRow.id),
        username: String(newRow.username),
        xp: Number(newRow.xp),
        nivel: Number(newRow.nivel)
      };
      localStorage.setItem(ACTIVE_USER_STORAGE_KEY, nuevo.username);
      return { ok: true, usuario: nuevo };
    }
  }

  public static async otorgarXP(username: string, puntos: number): Promise<void> {
    const db = await DatabaseService.getConnection();
    const stmt = db.prepare('SELECT xp FROM usuarios WHERE username = ?');
    stmt.bind([username]);
    let xpActual = 150;
    if (stmt.step()) {
      xpActual = Number(stmt.getAsObject().xp);
    }
    stmt.free();

    const nuevoXp = xpActual + puntos;
    const nuevoNivel = Math.max(1, Math.floor(nuevoXp / 150));

    db.run('UPDATE usuarios SET xp = ?, nivel = ? WHERE username = ?', [nuevoXp, nuevoNivel, username]);
    DatabaseService.persist();
  }

  public static async sincronizarCooldownsExpirados(username: string): Promise<boolean> {
    const db = await DatabaseService.getConnection();
    const ahora = Date.now();
    const limite = ahora - TIEMPO_RECARGA_MS;

    const check = db.prepare(
      'SELECT COUNT(*) as expirados FROM votos_por_frase WHERE username = ? AND votos_usados > 0 AND ultimo_reset_timestamp <= ?'
    );
    check.bind([username, limite]);
    check.step();
    const expirados = Number(check.getAsObject().expirados);
    check.free();

    if (expirados > 0) {
      db.run(
        'UPDATE votos_por_frase SET votos_usados = 0, ultimo_reset_timestamp = ? WHERE username = ? AND votos_usados > 0 AND ultimo_reset_timestamp <= ?',
        [ahora, username, limite]
      );
      DatabaseService.persist();
      return true;
    }
    return false;
  }

  public static async obtenerTodas(
    usernameActivo: string,
    categoriaFiltro = 'Todas',
    busqueda = ''
  ): Promise<FraseItem[]> {
    await this.sincronizarCooldownsExpirados(usernameActivo);
    const db = await DatabaseService.getConnection();

    let query = `
      SELECT 
        f.id, f.texto, f.personaje, f.obra, f.categoria, f.votos, f.creado_por,
        COALESCE(v.votos_usados, 0) as votos_usados,
        COALESCE(v.ultimo_reset_timestamp, 0) as ultimo_reset_timestamp
      FROM frases f
      LEFT JOIN votos_por_frase v ON f.id = v.frase_id AND v.username = ?
      WHERE 1=1
    `;
    const params: (string | number)[] = [usernameActivo];

    if (categoriaFiltro !== 'Todas') {
      query += ' AND f.categoria = ?';
      params.push(categoriaFiltro);
    }

    if (busqueda.trim() !== '') {
      query += ' AND (f.texto LIKE ? OR f.personaje LIKE ? OR f.obra LIKE ? OR f.creado_por LIKE ?)';
      const term = `%${busqueda.trim()}%`;
      params.push(term, term, term, term);
    }

    query += ' ORDER BY f.votos DESC, f.id DESC';

    const stmt = db.prepare(query);
    stmt.bind(params);

    const resultados: FraseItem[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      resultados.push({
        id: Number(row.id),
        texto: String(row.texto),
        personaje: String(row.personaje),
        obra: String(row.obra),
        categoria: String(row.categoria),
        votos: Number(row.votos),
        creado_por: String(row.creado_por),
        votos_usados: Number(row.votos_usados),
        ultimo_reset_timestamp: Number(row.ultimo_reset_timestamp)
      });
    }
    stmt.free();
    return resultados;
  }

  public static async obtenerPorId(id: number, usernameActivo: string): Promise<FraseItem | null> {
    const db = await DatabaseService.getConnection();
    const stmt = db.prepare(`
      SELECT 
        f.id, f.texto, f.personaje, f.obra, f.categoria, f.votos, f.creado_por,
        COALESCE(v.votos_usados, 0) as votos_usados,
        COALESCE(v.ultimo_reset_timestamp, 0) as ultimo_reset_timestamp
      FROM frases f
      LEFT JOIN votos_por_frase v ON f.id = v.frase_id AND v.username = ?
      WHERE f.id = ?
    `);
    stmt.bind([usernameActivo, id]);

    let item: FraseItem | null = null;
    if (stmt.step()) {
      const row = stmt.getAsObject();
      item = {
        id: Number(row.id),
        texto: String(row.texto),
        personaje: String(row.personaje),
        obra: String(row.obra),
        categoria: String(row.categoria),
        votos: Number(row.votos),
        creado_por: String(row.creado_por),
        votos_usados: Number(row.votos_usados),
        ultimo_reset_timestamp: Number(row.ultimo_reset_timestamp)
      };
    }
    stmt.free();
    return item;
  }

  public static async crear(
    texto: string,
    personaje: string,
    obra: string,
    categoria: string,
    creadoPor: string
  ): Promise<void> {
    const db = await DatabaseService.getConnection();
    db.run(
      'INSERT INTO frases (texto, personaje, obra, categoria, votos, creado_por) VALUES (?, ?, ?, ?, 1, ?)',
      [texto.trim(), personaje.trim(), obra.trim(), categoria, creadoPor]
    );
    DatabaseService.persist();
    await this.otorgarXP(creadoPor, 50);
  }

  public static async actualizar(
    id: number,
    texto: string,
    personaje: string,
    obra: string,
    categoria: string,
    usernameActivo: string
  ): Promise<boolean> {
    const db = await DatabaseService.getConnection();
    const check = db.prepare('SELECT creado_por FROM frases WHERE id = ?');
    check.bind([id]);
    if (!check.step() || String(check.getAsObject().creado_por) !== usernameActivo) {
      check.free();
      return false;
    }
    check.free();

    db.run(
      'UPDATE frases SET texto = ?, personaje = ?, obra = ?, categoria = ? WHERE id = ? AND creado_por = ?',
      [texto.trim(), personaje.trim(), obra.trim(), categoria, id, usernameActivo]
    );
    DatabaseService.persist();
    return true;
  }

  public static async eliminar(id: number, usernameActivo: string): Promise<boolean> {
    const db = await DatabaseService.getConnection();
    const check = db.prepare('SELECT creado_por FROM frases WHERE id = ?');
    check.bind([id]);
    if (!check.step() || String(check.getAsObject().creado_por) !== usernameActivo) {
      check.free();
      return false;
    }
    check.free();

    db.run('DELETE FROM frases WHERE id = ? AND creado_por = ?', [id, usernameActivo]);
    db.run('DELETE FROM votos_por_frase WHERE frase_id = ?', [id]);
    DatabaseService.persist();
    return true;
  }

  public static async votar(
    fraseId: number,
    delta: number,
    usernameActivo: string
  ): Promise<ResultadoVoto> {
    const db = await DatabaseService.getConnection();
    const ahora = Date.now();

    const stmt = db.prepare(
      'SELECT votos_usados, ultimo_reset_timestamp FROM votos_por_frase WHERE username = ? AND frase_id = ?'
    );
    stmt.bind([usernameActivo, fraseId]);

    let votosUsados = 0;
    let ultimoReset = ahora;
    let existeRegistro = false;

    if (stmt.step()) {
      const row = stmt.getAsObject();
      votosUsados = Number(row.votos_usados);
      ultimoReset = Number(row.ultimo_reset_timestamp);
      existeRegistro = true;
    }
    stmt.free();

    if (existeRegistro && ahora - ultimoReset >= TIEMPO_RECARGA_MS) {
      votosUsados = 0;
      ultimoReset = ahora;
      db.run(
        'UPDATE votos_por_frase SET votos_usados = 0, ultimo_reset_timestamp = ? WHERE username = ? AND frase_id = ?',
        [ahora, usernameActivo, fraseId]
      );
    }

    if (votosUsados >= MAX_VOTOS_POR_FRASE) {
      return {
        exito: false,
        mensaje: 'Limite de 10 votos alcanzado en esta frase. Espera la recarga.'
      };
    }

    const nuevosUsados = votosUsados + 1;
    const timestampCiclo = votosUsados === 0 ? ahora : ultimoReset;

    if (existeRegistro) {
      db.run(
        'UPDATE votos_por_frase SET votos_usados = ?, ultimo_reset_timestamp = ? WHERE username = ? AND frase_id = ?',
        [nuevosUsados, timestampCiclo, usernameActivo, fraseId]
      );
    } else {
      db.run(
        'INSERT INTO votos_por_frase (username, frase_id, votos_usados, ultimo_reset_timestamp) VALUES (?, ?, ?, ?)',
        [usernameActivo, fraseId, nuevosUsados, ahora]
      );
    }

    db.run('UPDATE frases SET votos = MAX(0, votos + ?) WHERE id = ?', [delta, fraseId]);
    DatabaseService.persist();
    await this.otorgarXP(usernameActivo, 15);

    return { exito: true };
  }
}