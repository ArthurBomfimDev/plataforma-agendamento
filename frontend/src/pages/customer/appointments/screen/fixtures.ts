import type { CustomerAppointment } from './types'

/**
 * Dados de TESTE, copiados do wireframe "08 · Meus agendamentos" do Figma. O app usa a API;
 * estes servem às histórias de teste da tela.
 */

export const createMockAppointments = (now = new Date()): CustomerAppointment[] => [
  {
    id: 'apt-estudio-duartina',
    businessName: 'Estúdio Duartina',
    serviceName: 'Corte masculino',
    status: 'pending',
    date: '2026-09-11',
    time: '09:30',
    durationMinutes: 30,
    timeZone: 'America/Sao_Paulo',
    // Enviado há 50 min: "expira em 11 h", como no wireframe.
    // Enviado há 50 min, com prazo de confirmação de 12 h.
    expiresAt: new Date(now.getTime() + (12 * 60 - 50) * 60_000),
  },
  {
    id: 'apt-barbearia-norte',
    businessName: 'Barbearia Norte',
    serviceName: 'Corte + barba',
    status: 'confirmed',
    date: '2026-09-14',
    time: '15:00',
    durationMinutes: 60,
    timeZone: 'America/Sao_Paulo',
    address: 'Rua Exemplo, 250',
    distanceKm: 2.6,
  },
  {
    id: 'apt-salao-vila-rica',
    businessName: 'Salão Vila Rica',
    serviceName: 'Corte feminino',
    status: 'completed',
    date: '2026-08-22',
    time: '10:00',
    durationMinutes: 45,
    timeZone: 'America/Sao_Paulo',
    reviewable: true,
  },
]
