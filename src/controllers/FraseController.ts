import { FraseModel } from '../models/Frase';
import { FraseView } from '../views/FraseView';
import { ACTIVE_USER_STORAGE_KEY } from '../db/database';

export class FraseController {
  private view: FraseView;
  private categoriaActual = 'Todas';
  private busquedaActual = '';
  private timerId: number | null = null;

  constructor(view: FraseView) {
    this.view = view;
  }

  public async iniciar(): Promise<void> {
    this.configurarEventos();
    await this.verificarSesionInicial();
    await this.refrescarVista();
    this.iniciarTemporizadorCooldown();
  }

  private async verificarSesionInicial(): Promise<void> {
    localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);

    const activo = await FraseModel.obtenerUsuarioActivo();
    const todosUsuarios = await FraseModel.obtenerUsuarios();

    this.view.renderizarUsuario(activo, todosUsuarios);
    this.view.configurarModoAuth('login');
    this.view.mostrarModalUsuario(true);
  }

  private iniciarTemporizadorCooldown(): void {
    if (this.timerId) window.clearInterval(this.timerId);
    this.timerId = window.setInterval(async () => {
      const requiereRefrescoSQL = this.view.actualizarRelojesEnVivo();
      if (requiereRefrescoSQL) {
        await this.refrescarVista();
      }
    }, 1000);
  }

  private async refrescarVista(): Promise<void> {
    const activo = await FraseModel.obtenerUsuarioActivo();
    const todosUsuarios = await FraseModel.obtenerUsuarios();
    const frasesFiltradas = await FraseModel.obtenerTodas(
      activo.username,
      this.categoriaActual,
      this.busquedaActual
    );
    const todasLasFrases = await FraseModel.obtenerTodas(activo.username, 'Todas', '');

    this.view.renderizarUsuario(activo, todosUsuarios);
    this.view.renderizar(frasesFiltradas, todasLasFrases, activo.username);
  }

  private configurarEventos(): void {
    const form = document.getElementById('frase-form') as HTMLFormElement | null;
    const cancelBtn = document.getElementById('btn-cancel') as HTMLButtonElement | null;
    const grid = document.getElementById('frases-grid') as HTMLElement | null;
    const filtroCat = document.getElementById('filtro-categoria') as HTMLSelectElement | null;
    const inputBuscar = document.getElementById('filtro-busqueda') as HTMLInputElement | null;
    const sidebarMenu = document.getElementById('sidebar-filters');
    const indicator = document.getElementById('filter-indicator');

    const userForm = document.getElementById('user-register-form') as HTMLFormElement | null;
    const authModeInput = document.getElementById('auth-mode') as HTMLInputElement | null;
    const regUsername = document.getElementById('reg-username') as HTMLInputElement | null;
    const regPassword = document.getElementById('reg-password') as HTMLInputElement | null;
    const regPassConfirm = document.getElementById('reg-password-confirm') as HTMLInputElement | null;
    const btnOpenProfile = document.getElementById('btn-open-profile') as HTMLButtonElement | null;
    const btnAvatarUser = document.getElementById('btn-avatar-user') as HTMLButtonElement | null;
    const btnToggleAuthMode = document.getElementById('btn-toggle-auth-mode') as HTMLButtonElement | null;
    const btnCerrarSesion = document.getElementById('btn-cerrar-sesion') as HTMLButtonElement | null;

    btnToggleAuthMode?.addEventListener('click', () => {
      const modoActual = authModeInput?.value || 'register';
      const nuevoModo = modoActual === 'register' ? 'login' : 'register';
      this.view.configurarModoAuth(nuevoModo);
    });

    btnCerrarSesion?.addEventListener('click', () => {
      localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
      this.view.configurarModoAuth('login');
      this.view.mostrarModalUsuario(true);
      this.view.mostrarToast('Sesion cerrada correctamente.');
    });

    userForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!regUsername || !regPassword) return;

      const modo = (authModeInput?.value || 'register') as 'register' | 'login';

      if (modo === 'register') {
        const p1 = regPassword.value.trim();
        const p2 = regPassConfirm?.value.trim() || '';
        if (p1 !== p2) {
          this.view.mostrarErrorAuth('Las contrasenas no coinciden.');
          return;
        }
      }

      const res = await FraseModel.autenticarORegistrar(regUsername.value, regPassword.value, modo);
      if (!res.ok) {
        this.view.mostrarErrorAuth(res.error || 'Error de autenticacion');
        return;
      }

      this.view.mostrarModalUsuario(false);
      this.view.limpiarFormulario();
      this.view.mostrarToast(`Sesion activa como ${res.usuario?.username}`);
      await this.refrescarVista();
    });

    btnOpenProfile?.addEventListener('click', () => {
      this.view.configurarModoAuth('login');
      this.view.mostrarModalUsuario(true);
    });

    btnAvatarUser?.addEventListener('click', () => {
      this.view.configurarModoAuth('login');
      this.view.mostrarModalUsuario(true);
    });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const datos = this.view.obtenerDatosFormulario();
      if (!datos.texto.trim() || !datos.personaje.trim() || !datos.obra.trim()) return;

      const activo = await FraseModel.obtenerUsuarioActivo();

      if (datos.id) {
        const ok = await FraseModel.actualizar(
          datos.id,
          datos.texto,
          datos.personaje,
          datos.obra,
          datos.categoria,
          activo.username
        );
        if (!ok) {
          this.view.mostrarToast('Solo el autor original puede editar esta frase.');
          return;
        }
        this.view.mostrarToast('Frase actualizada en SQLite.');
      } else {
        await FraseModel.crear(
          datos.texto,
          datos.personaje,
          datos.obra,
          datos.categoria,
          activo.username
        );
        this.view.mostrarToast('Nueva frase desplegada (+50 XP).');
      }

      this.view.limpiarFormulario();
      await this.refrescarVista();
    });

    cancelBtn?.addEventListener('click', () => {
      this.view.limpiarFormulario();
    });

    grid?.addEventListener('click', async (e) => {
      const target = (e.target as HTMLElement).closest('button');
      if (!target) return;

      const action = target.getAttribute('data-action');
      const id = Number(target.getAttribute('data-id'));
      if (!id || !action) return;

      const activo = await FraseModel.obtenerUsuarioActivo();

      if (action === 'upvote') {
        const delta = 1;
        const resultado = await FraseModel.votar(id, delta, activo.username);

        if (!resultado.exito) {
          this.view.mostrarToast(
            resultado.mensaje || 'Limite de 10 votos alcanzado en esta frase. Espera la recarga.'
          );
          return;
        }

        await this.refrescarVista();
        this.view.dispararAnimacionVoto(id);
      } else if (action === 'edit') {
        const frase = await FraseModel.obtenerPorId(id, activo.username);
        if (frase && frase.creado_por === activo.username) {
          this.view.cargarEnFormulario(frase);
        } else {
          this.view.mostrarToast('Accion bloqueada: no eres el creador de esta frase.');
        }
      } else if (action === 'delete') {
        const ok = await FraseModel.eliminar(id, activo.username);
        if (ok) {
          this.view.mostrarToast('Frase eliminada de SQLite.');
          await this.refrescarVista();
        } else {
          this.view.mostrarToast('Accion bloqueada: no eres el creador de esta frase.');
        }
      }
    });

    filtroCat?.addEventListener('change', async () => {
      this.categoriaActual = filtroCat.value;
      if (indicator) indicator.textContent = `MOSTRANDO: ${this.categoriaActual.toUpperCase()}`;

      if (sidebarMenu) {
        sidebarMenu.querySelectorAll('.nav-item').forEach((el) => {
          const catBtn = el.getAttribute('data-cat');
          el.classList.toggle('active', catBtn === this.categoriaActual);
        });
      }
      await this.refrescarVista();
    });

    inputBuscar?.addEventListener('input', async () => {
      this.busquedaActual = inputBuscar.value;
      await this.refrescarVista();
    });

    sidebarMenu?.addEventListener('click', async (e) => {
      const btn = (e.target as HTMLElement).closest('.nav-item') as HTMLElement | null;
      if (!btn) return;

      sidebarMenu.querySelectorAll('.nav-item').forEach((el) => el.classList.remove('active'));
      btn.classList.add('active');

      const cat = btn.getAttribute('data-cat') || 'Todas';
      this.categoriaActual = cat;
      if (filtroCat) filtroCat.value = cat;
      if (indicator) indicator.textContent = `MOSTRANDO: ${cat.toUpperCase()}`;
      await this.refrescarVista();
    });
  }
}