/**
 * URL base da API. Vem de variável de ambiente (regra 1 de empacotamento, CLAUDE.md §3) e nunca de
 * `window.location.origin` (regra 2): dentro do Capacitor e do Tauri a origem não é a da API.
 *
 * É embutida no build pelo Vite. Em desenvolvimento, defina em `frontend/.env.local`;
 * no Docker, chega como build arg (ver `compose.yaml`).
 */
export const apiBaseUrl: string = import.meta.env.VITE_API_BASE_URL ?? ''
