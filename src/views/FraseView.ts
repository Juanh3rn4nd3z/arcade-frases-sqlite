import {
  MAX_VOTOS_POR_FRASE,
  TIEMPO_RECARGA_MS,
  type FraseItem,
  type UsuarioItem
} from '../models/Frase';

export class FraseView {
  private listContainer = document.getElementById('frases-grid') as HTMLElement;
  private topPodioContainer = document.getElementById('top-podio') as HTMLElement;
  private heroBanner = document.getElementById('hero-quote-banner') as HTMLElement;
  private statsTotal = document.getElementById('stat-total') as HTMLElement;
  private statsVotos = document.getElementById('stat-votos') as HTMLElement;
  private toastEl = document.getElementById('arcade-toast') as HTMLElement;

  private form = document.getElementById('frase-form') as HTMLFormElement;
  private inputId = document.getElementById('frase-id') as HTMLInputElement;
  private inputTexto = document.getElementById('frase-texto') as HTMLTextAreaElement;
  private inputPersonaje = document.getElementById('frase-personaje') as HTMLInputElement;
  private inputObra = document.getElementById('frase-obra') as HTMLInputElement;
  private inputCategoria = document.getElementById('frase-categoria') as HTMLSelectElement;
  private submitBtn = document.getElementById('btn-submit') as HTMLButtonElement;
  private cancelBtn = document.getElementById('btn-cancel') as HTMLButtonElement;
  private formTitle = document.getElementById('form-title') as HTMLElement;

  private userModal = document.getElementById('user-modal') as HTMLElement;
  private authErrorMsg = document.getElementById('auth-error-msg') as HTMLElement;
  private activeUserName = document.getElementById('active-user-name') as HTMLElement;
  private activeUserLevelPill = document.getElementById('active-user-level-pill') as HTMLElement;
  private activeUserInitials = document.getElementById('active-user-initials') as HTMLElement;
  private sidebarInitials = document.getElementById('sidebar-initials') as HTMLElement;
  private sidebarLevel = document.getElementById('sidebar-level') as HTMLElement;
  private sidebarXp = document.getElementById('sidebar-xp') as HTMLElement;
  private sidebarXpBar = document.getElementById('sidebar-xp-bar') as HTMLElement;

  private authModeInput = document.getElementById('auth-mode') as HTMLInputElement;
  private authFormHeading = document.getElementById('auth-form-heading') as HTMLElement;
  private authFormSubheading = document.getElementById('auth-form-subheading') as HTMLElement;
  private confirmPassBlock = document.getElementById('confirm-pass-block') as HTMLElement;
  private bonificationBanner = document.getElementById('bonification-banner') as HTMLElement;
  private authSubmitBtn = document.getElementById('auth-submit-btn') as HTMLButtonElement;
  private authSwitchText = document.getElementById('auth-switch-text') as HTMLElement;
  private btnToggleAuthMode = document.getElementById('btn-toggle-auth-mode') as HTMLButtonElement;
  private regPassConfirm = document.getElementById('reg-password-confirm') as HTMLInputElement;

  private toastTimer: number | null = null;

  public renderizarUsuario(usuario: UsuarioItem, _todosUsuarios: UsuarioItem[]): void {
    this.activeUserName.textContent = usuario.username;
    this.activeUserLevelPill.textContent = `NIVEL ${usuario.nivel}`;

    const iniciales = usuario.username.slice(0, 2).toUpperCase();
    this.activeUserInitials.textContent = iniciales;
    if (this.sidebarInitials) this.sidebarInitials.textContent = iniciales;

    this.sidebarLevel.textContent = `Nivel ${usuario.nivel}`;
    this.sidebarXp.textContent = `${usuario.xp.toLocaleString('es-SV')} XP`;

    const progresoNivel = Math.min(100, Math.round(((usuario.xp % 150) / 150) * 100));
    if (this.sidebarXpBar) {
      this.sidebarXpBar.style.width = `${Math.max(12, progresoNivel)}%`;
    }
  }

  public mostrarModalUsuario(mostrar: boolean): void {
    if (!this.userModal) return;
    if (mostrar) {
      this.ocultarErrorAuth();
      this.userModal.classList.remove('hidden');
    } else {
      this.userModal.classList.add('hidden');
    }
  }

  public configurarModoAuth(modo: 'register' | 'login'): void {
    if (this.authModeInput) this.authModeInput.value = modo;

    if (modo === 'register') {
      if (this.authFormHeading) this.authFormHeading.textContent = 'CREAR CUENTA';
      if (this.authFormSubheading) this.authFormSubheading.textContent = 'Unete a la comunidad de FRASES EPICAS';
      if (this.confirmPassBlock) this.confirmPassBlock.classList.remove('hidden');
      if (this.bonificationBanner) this.bonificationBanner.classList.remove('hidden');
      if (this.authSubmitBtn) this.authSubmitBtn.textContent = 'CREAR MI CUENTA';
      if (this.authSwitchText) this.authSwitchText.textContent = '¿YA TIENES UNA CUENTA?';
      if (this.btnToggleAuthMode) this.btnToggleAuthMode.textContent = 'INICIAR SESION';
      if (this.regPassConfirm) this.regPassConfirm.required = true;
    } else {
      if (this.authFormHeading) this.authFormHeading.textContent = 'INICIAR SESION';
      if (this.authFormSubheading) this.authFormSubheading.textContent = 'Accede a tu cuenta existente';
      if (this.confirmPassBlock) this.confirmPassBlock.classList.add('hidden');
      if (this.bonificationBanner) this.bonificationBanner.classList.add('hidden');
      if (this.authSubmitBtn) this.authSubmitBtn.textContent = 'ENTRAR AL SISTEMA';
      if (this.authSwitchText) this.authSwitchText.textContent = '¿NO TIENES UNA CUENTA?';
      if (this.btnToggleAuthMode) this.btnToggleAuthMode.textContent = 'CREAR CUENTA';
      if (this.regPassConfirm) this.regPassConfirm.required = false;
    }
    this.ocultarErrorAuth();
  }

  public mostrarErrorAuth(mensaje: string): void {
    if (!this.authErrorMsg) return;
    this.authErrorMsg.textContent = mensaje;
    this.authErrorMsg.classList.remove('hidden');
  }

  public ocultarErrorAuth(): void {
    if (!this.authErrorMsg) return;
    this.authErrorMsg.textContent = '';
    this.authErrorMsg.classList.add('hidden');
  }

  public mostrarToast(mensaje: string): void {
    if (!this.toastEl) return;
    this.toastEl.textContent = mensaje;
    this.toastEl.classList.remove('hidden');

    if (this.toastTimer) window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => {
      this.toastEl.classList.add('hidden');
    }, 3200);
  }

  public dispararAnimacionVoto(fraseId: number): void {
    const card = this.listContainer.querySelector(`.neon-quote-row[data-id="${fraseId}"]`);
    if (!card) return;
    const voteBox = card.querySelector('.vote-control-box');
    if (!voteBox) return;

    const floater = document.createElement('span');
    floater.className = 'vote-floater float-plus';
    floater.textContent = '+1';
    voteBox.appendChild(floater);

    window.setTimeout(() => {
      floater.remove();
    }, 750);
  }

  public renderizar(
    frases: FraseItem[],
    todasParaPodio: FraseItem[],
    usernameActivo: string
  ): void {
    const totalVotos = todasParaPodio.reduce((acc, f) => acc + f.votos, 0);

    if (this.statsTotal) this.statsTotal.textContent = todasParaPodio.length.toLocaleString('es-SV');
    if (this.statsVotos) this.statsVotos.textContent = totalVotos.toLocaleString('es-SV');

    this.renderizarHero(todasParaPodio[0] || null);
    this.renderizarPodio(todasParaPodio.slice(0, 10));

    if (!this.listContainer) return;

    if (frases.length === 0) {
      this.listContainer.innerHTML = `
        <div class="empty-state">
          <p>No se encontraron frases con los criterios seleccionados en SQLite.</p>
        </div>
      `;
      return;
    }

    this.listContainer.innerHTML = frases
      .map((f) => {
        const esPropietario = f.creado_por === usernameActivo;
        const badgeClass = this.obtenerClaseCategoria(f.categoria);
        const disponibles = Math.max(0, MAX_VOTOS_POR_FRASE - f.votos_usados);
        const enCooldown = disponibles === 0;
        const textoTiempo = enCooldown
          ? this.formatearTiempoRestante(f.ultimo_reset_timestamp)
          : '';

        return `
      <article class="neon-quote-row" data-id="${f.id}" data-usados="${f.votos_usados}" data-reset="${f.ultimo_reset_timestamp}">
        <div class="glow-line-top"></div>

        ${
          esPropietario
            ? `
          <div class="crud-hover-tools">
            <button type="button" class="btn-icon-crud edit" data-action="edit" data-id="${f.id}" title="Editar frase">
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
            </button>
            <button type="button" class="btn-icon-crud delete" data-action="delete" data-id="${f.id}" title="Eliminar frase">
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        `
            : ''
        }

        <div class="quote-row-left">
          <h2 class="quote-main-text">"${this.escaparHTML(f.texto)}"</h2>
          <p class="quote-sub-meta">
            <strong>${this.escaparHTML(f.personaje)}</strong> — ${this.escaparHTML(f.obra)}
          </p>

          <div class="quote-tags-row">
            <span class="cat-pill ${badgeClass}">${this.escaparHTML(f.categoria)}</span>

            <span class="energy-indicator ${enCooldown ? 'cooldown-active' : ''}" data-role="energy-status">
              ${
                enCooldown
                  ? `Recarga en ${textoTiempo}`
                  : `${disponibles}/${MAX_VOTOS_POR_FRASE} votos disp.`
              }
            </span>

            ${
              esPropietario
                ? `<span class="owner-badge own">Tu publicacion (${this.escaparHTML(f.creado_por)})</span>`
                : `<span class="owner-badge locked">
                    <svg viewBox="0 0 24 24" width="11" height="11" stroke="currentColor" stroke-width="2" fill="none">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    Publicado por ${this.escaparHTML(f.creado_por)}
                  </span>`
            }
          </div>
        </div>

        <div class="quote-row-right">
          <div class="vote-control-box">
            <button
              type="button"
              class="vote-arrow btn-up"
              data-action="upvote"
              data-id="${f.id}"
              ${enCooldown ? 'disabled' : ''}
              title="Voto positivo (+1)"
            >
              &#9650;
            </button>
            <strong class="vote-score-num">${f.votos.toLocaleString('es-SV')}</strong>
          </div>
        </div>

        <div class="glow-line-bottom"></div>
      </article>
    `;
      })
      .join('');
  }

  public actualizarRelojesEnVivo(): boolean {
    if (!this.listContainer) return false;
    const tarjetas = this.listContainer.querySelectorAll<HTMLElement>('.neon-quote-row');
    const ahora = Date.now();
    let huboReinicio = false;

    tarjetas.forEach((card) => {
      const usados = Number(card.getAttribute('data-usados') || '0');
      const resetTs = Number(card.getAttribute('data-reset') || '0');
      if (usados <= 0 || resetTs <= 0) return;

      const transcurrido = ahora - resetTs;
      if (transcurrido >= TIEMPO_RECARGA_MS) {
        huboReinicio = true;
        return;
      }

      if (usados >= MAX_VOTOS_POR_FRASE) {
        const statusEl = card.querySelector<HTMLElement>('[data-role="energy-status"]');
        if (statusEl) {
          statusEl.textContent = `Recarga en ${this.formatearTiempoRestante(resetTs)}`;
        }
      }
    });

    return huboReinicio;
  }

  private formatearTiempoRestante(ultimoReset: number): string {
    const restanteMs = Math.max(0, TIEMPO_RECARGA_MS - (Date.now() - ultimoReset));
    const totalSeg = Math.ceil(restanteMs / 1000);
    const min = Math.floor(totalSeg / 60);
    const seg = totalSeg % 60;
    return `${String(min).padStart(2, '0')}:${String(seg).padStart(2, '0')}`;
  }

  private renderizarHero(lider: FraseItem | null): void {
    if (!this.heroBanner) return;
    if (!lider) {
      this.heroBanner.innerHTML = `
        <div class="hero-strip-content">
          <div class="hero-text-side">
            <span class="hero-badge">BOVEDA SQLITE LISTA</span>
            <h3 class="hero-strip-quote">Registra la primera frase epica desde el panel derecho</h3>
          </div>
        </div>
      `;
      return;
    }

    this.heroBanner.innerHTML = `
      <div class="hero-strip-content">
        <div class="hero-text-side" style="width: 100%;">
          <div class="hero-top-tags">
            <span class="hero-badge">LIDER ACTUAL DEL RANKING SQLITE (#1)</span>
            <span class="hero-points-pill">
              <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2.2" fill="none">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              ${lider.votos.toLocaleString('es-SV')} PTS
            </span>
          </div>
          <h3 class="hero-strip-quote">"${this.escaparHTML(lider.texto)}"</h3>
          <small>${this.escaparHTML(lider.personaje)} — ${this.escaparHTML(lider.obra)} | Categoria: ${this.escaparHTML(lider.categoria)}</small>
        </div>
      </div>
    `;
  }

  private renderizarPodio(top10: FraseItem[]): void {
    if (!this.topPodioContainer) return;

    this.topPodioContainer.innerHTML = top10
      .map(
        (f, i) => `
      <div class="medal-row">
        <div class="medal-left">
          <span class="rank-pos pos-${i + 1}">#${i + 1}</span>
          <span class="medal-quote" title="${this.escaparHTML(f.texto)}">"${this.escaparHTML(f.texto)}"</span>
        </div>
        <strong class="medal-pts">${f.votos.toLocaleString('es-SV')} pts</strong>
      </div>
    `
      )
      .join('');
  }

  private obtenerClaseCategoria(cat: string): string {
    const c = cat.toLowerCase();
    if (c.includes('juego')) return 'pill-cyan';
    if (c.includes('serie') || c.includes('cine')) return 'pill-pink';
    if (c.includes('meme') || c.includes('cultura')) return 'pill-lime';
    return 'pill-amber';
  }

  public cargarEnFormulario(frase: FraseItem): void {
    this.inputId.value = String(frase.id);
    this.inputTexto.value = frase.texto;
    this.inputPersonaje.value = frase.personaje;
    this.inputObra.value = frase.obra;
    this.inputCategoria.value = frase.categoria;

    this.formTitle.textContent = `EDITANDO FRASE #${frase.id}`;
    this.submitBtn.textContent = 'ACTUALIZAR EN SQLITE';
    this.cancelBtn.classList.remove('hidden');
    this.form.scrollIntoView({ behavior: 'smooth' });
  }

  public limpiarFormulario(): void {
    this.form.reset();
    this.inputId.value = '';
    this.formTitle.textContent = 'PUBLICA TU FRASE';
    this.submitBtn.textContent = 'COMPARTE UNA FRASE';
    this.cancelBtn.classList.add('hidden');
  }

  public obtenerDatosFormulario(): {
    id: number | null;
    texto: string;
    personaje: string;
    obra: string;
    categoria: string;
  } {
    return {
      id: this.inputId.value ? Number(this.inputId.value) : null,
      texto: this.inputTexto.value,
      personaje: this.inputPersonaje.value,
      obra: this.inputObra.value,
      categoria: this.inputCategoria.value
    };
  }

  private escaparHTML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}