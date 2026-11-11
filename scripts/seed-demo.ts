/**
 * Popula o ambiente local com dados de DEMONSTRAÇÃO. Todo estabelecimento, pessoa, CNPJ, endereço e
 * agendamento daqui é FICTÍCIO: nomes gerados, CNPJs válidos só pelo dígito verificador (`cnpjFrom`),
 * ruas "de demonstração" e e-mails no domínio reservado `example.com`. Nenhum dado real.
 *
 * Duas etapas:
 *
 *   bun scripts/seed-demo.ts              30 estabelecimentos pela própria API (cadastro, estabelecimento,
 *                                         profissionais, serviços, jornada, submissão) e aprovação pelo
 *                                         Admin de demonstração em `api/admin/businesses`. Os 3 primeiros
 *                                         ganham uma agenda pequena de hoje (balcão) e de amanhã (pedidos),
 *                                         para o painel não abrir vazio.
 *
 *   bun scripts/seed-demo.ts --passado    (alias: --historico)
 *                                         ⚠️ SÓ PARA O BANCO LOCAL DO DOCKER. Consumidores fictícios,
 *                                         60 dias de histórico (concluídos, cancelados, faltas) e agenda
 *                                         futura parcialmente ocupada, gravados por SQL direto: o passado
 *                                         não passa pela API (antecedência mínima, horizonte). Roda as duas
 *                                         etapas, nesta ordem.
 *
 * PASSADO POR SQL (decisão do Arthur, opção (c)): a API não deixa criar nem concluir um atendimento que já passou
 * (`Appointment.Complete` exige `now >= EndsAt`), e a avaliação exige atendimento concluído. Em vez de um endpoint de
 * bypass ou de um relógio falsificável na API, o passado entra por SQL no Postgres do Docker local, em passo explícito
 * (`--passado`, mais as avaliações), com marcador em `customer_notes` e uma transação só. A API de produção não ganha
 * nada. Tudo o que NÃO depende do relógio — fotos, folgas, consentimento, agenda futura — passa pela API pública.
 *
 * Fotos, folgas e consentimento (demonstração final): `scripts/seed-demo/` (imagens originais geradas por código ou
 * arquivos de `scripts/seed-assets/`, enviados pelo upload da interface), tudo idempotente.
 *
 * Escrita direta no banco, além do histórico: conceder o papel de Admin (ADR-020 — nunca por endpoint) e
 * confirmar o e-mail das contas de demonstração (Onda 6A — `example.com` não recebe e-mail).
 *
 * Idempotente e reexecutável: conta que já existe é pulada, CNPJ já cadastrado é pulado, e o histórico só
 * é gravado uma vez (marcador em `customer_notes`). Com `docker compose up` rodando.
 *
 * Bairros: os 7 que o Nominatim (OpenStreetMap) devolveu como bairro de Garça-SP em 27/10/2026, a partir da
 * lista de bairros da Página Amarela. Cada estabelecimento fica a até ~300 m do ponto do bairro — o ponto é
 * gerado, não é endereço real. Os 3 estabelecimentos originais mantêm o ponto do seed anterior.
 *
 * Senhas (Onda 7H). As contas usam `SEED_PASSWORD`; sem ela, a senha padrão de TESTE abaixo, que está no
 * repositório e por isso só serve no ambiente local: com a API fora de Development (a demonstração pública), o seed
 * se recusa a usá-la, salvo com `--permitir-senha-padrao`. O Admin usa `SEED_ADMIN_PASSWORD`; sem ela, uma senha
 * aleatória gerada nesta execução e mostrada uma vez no fim.
 */

import { fileFor, imageFor } from './seed-demo/assets'
import {
  TIME_OFF_REASON,
  hasCover,
  professionalHasPhoto,
  serviceHasPhoto,
  serviceShowsPhotoInShowcase,
  timeOffPlan,
} from './seed-demo/plan'
import { addDays, zonedToUtc } from './seed-demo/time'

const API = process.env.API_URL ?? 'http://localhost:8081'
const DEFAULT_PASSWORD = 'demo-12345678'
const DEMO_PASSWORD = process.env.SEED_PASSWORD || DEFAULT_PASSWORD
const ADMIN_PASSWORD_FROM_ENV = process.env.SEED_ADMIN_PASSWORD || null
const ADMIN_PASSWORD = ADMIN_PASSWORD_FROM_ENV ?? randomPassword()
const TIME_ZONE = 'America/Sao_Paulo'
const WITH_HISTORY = process.argv.includes('--passado') || process.argv.includes('--historico')
const ALLOW_DEFAULT_PASSWORD = process.argv.includes('--permitir-senha-padrao')

/** 24 caracteres de base64url (18 bytes do gerador seguro): passa em qualquer regra de senha da API. */
function randomPassword() {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(18))).toString('base64url')
}

type Json = Record<string, unknown>

class ApiCallError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | undefined,
    message: string,
  ) {
    super(message)
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function call<T = Json>(method: string, path: string, body?: unknown, token?: string): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(`${API}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })

    // As rotas de autenticação aceitam 10 chamadas por minuto por IP.
    if (response.status === 429 && attempt < 12) {
      console.log('  limite de requisições de autenticação; aguardando 15 s…')
      await sleep(15_000)
      continue
    }

    const text = await response.text()
    const isJson = response.headers.get('content-type')?.includes('json') ?? false
    const data = text && isJson ? JSON.parse(text) : undefined

    if (!response.ok) {
      const code = data?.code as string | undefined
      throw new ApiCallError(response.status, code, `${method} ${path} → ${response.status} ${code ?? text}`)
    }

    return data as T
  }
}

/** CNPJ com dígitos verificadores válidos, gerado a partir de uma raiz fixa — fictício. */
function cnpjFrom(root: string): string {
  const digits = root.padStart(12, '0').slice(0, 12).split('').map(Number)
  const check = (base: number[], weights: number[]) => {
    const sum = base.reduce((acc, digit, index) => acc + digit * weights[index]!, 0)
    const rest = sum % 11
    return rest < 2 ? 0 : 11 - rest
  }
  const first = check(digits, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  const second = check([...digits, first], [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  return [...digits, first, second].join('')
}

/** Gerador pseudoaleatório com semente (mulberry32): a mesma execução gera sempre os mesmos dados. */
function seededRandom(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const pick = <T>(random: () => number, items: readonly T[]): T => items[Math.floor(random() * items.length)]!

// --- Catálogo de demonstração -------------------------------------------------------------------------

type DemoService = {
  name: string
  description: string
  durationMinutes: number
  priceCents: number
  bufferAfterMinutes?: number
}
type DemoProfessional = { displayName: string; specialty: string; bio: string; isMe: boolean; pattern: number }
type DemoBusiness = {
  owner: { fullName: string; email: string }
  name: string
  cnpjRoot: string
  category: 'Beleza' | 'Saude'
  autoConfirm: boolean
  address: { street: string; streetNumber: string; district: string; city: string; state: string; postalCode: string }
  location: { latitude: number; longitude: number }
  professionals: DemoProfessional[]
  services: DemoService[]
}

/** Jornadas. `DayOfWeek` do .NET: 0 = domingo. Duas linhas no mesmo dia são a pausa do almoço. */
const PATTERNS: { day: number; start: string; end: string }[][] = [
  [1, 2, 3, 4, 5].map((day) => ({ day, start: '09:00:00', end: '18:00:00' })),
  [2, 3, 4, 5, 6].flatMap((day) => [
    { day, start: '09:00:00', end: '12:00:00' },
    { day, start: '13:00:00', end: '19:00:00' },
  ]),
  [1, 2, 3, 4, 5, 6].map((day) => ({ day, start: '08:00:00', end: '14:00:00' })),
  [1, 2, 3, 4, 5].map((day) => ({ day, start: '13:00:00', end: '21:00:00' })),
]

const KINDS = {
  barbearia: {
    category: 'Beleza',
    label: 'Barbearia',
    specialty: 'Barbeiro',
    services: [
      { name: 'Corte masculino', description: 'Corte na tesoura ou máquina, com finalização.', durationMinutes: 30, priceCents: 4000 },
      { name: 'Barba', description: 'Barba modelada com navalha.', durationMinutes: 20, priceCents: 3000 },
      { name: 'Corte + barba', description: 'Corte completo e barba com toalha quente.', durationMinutes: 50, priceCents: 6500 },
      { name: 'Pigmentação', description: 'Pigmentação de barba ou cabelo.', durationMinutes: 40, priceCents: 5500 },
    ],
  },
  salao: {
    category: 'Beleza',
    label: 'Salão',
    specialty: 'Cabeleireira',
    services: [
      { name: 'Corte feminino', description: 'Corte e finalização.', durationMinutes: 50, priceCents: 7000 },
      { name: 'Escova', description: 'Escova modeladora.', durationMinutes: 40, priceCents: 5000 },
      { name: 'Coloração', description: 'Coloração completa.', durationMinutes: 120, priceCents: 18000, bufferAfterMinutes: 10 },
      { name: 'Hidratação', description: 'Hidratação profunda.', durationMinutes: 45, priceCents: 6000 },
    ],
  },
  esmalteria: {
    category: 'Beleza',
    label: 'Esmalteria',
    specialty: 'Manicure',
    services: [
      { name: 'Manicure', description: 'Cutilagem e esmaltação.', durationMinutes: 45, priceCents: 3500 },
      { name: 'Pedicure', description: 'Cutilagem e esmaltação dos pés.', durationMinutes: 45, priceCents: 4000 },
      { name: 'Pé e mão', description: 'Manicure e pedicure.', durationMinutes: 90, priceCents: 6500 },
      { name: 'Unha em gel', description: 'Alongamento em gel.', durationMinutes: 90, priceCents: 12000 },
    ],
  },
  estetica: {
    category: 'Beleza',
    label: 'Estética',
    specialty: 'Esteticista',
    services: [
      { name: 'Limpeza de pele', description: 'Limpeza de pele profunda.', durationMinutes: 60, priceCents: 12000 },
      { name: 'Design de sobrancelha', description: 'Design com pinça e linha.', durationMinutes: 30, priceCents: 4000 },
      { name: 'Depilação', description: 'Depilação com cera.', durationMinutes: 30, priceCents: 5000 },
    ],
  },
  fisioterapia: {
    category: 'Saude',
    label: 'Clínica de Fisioterapia',
    specialty: 'Fisioterapeuta',
    services: [
      { name: 'Sessão de fisioterapia', description: 'Sessão individual.', durationMinutes: 50, priceCents: 12000, bufferAfterMinutes: 10 },
      { name: 'Avaliação fisioterapêutica', description: 'Primeira consulta.', durationMinutes: 60, priceCents: 15000, bufferAfterMinutes: 10 },
    ],
  },
  nutricao: {
    category: 'Saude',
    label: 'Consultório de Nutrição',
    specialty: 'Nutricionista',
    services: [
      { name: 'Consulta de nutrição', description: 'Primeira consulta com avaliação.', durationMinutes: 60, priceCents: 18000 },
      { name: 'Retorno de nutrição', description: 'Acompanhamento.', durationMinutes: 30, priceCents: 9000 },
    ],
  },
  psicologia: {
    category: 'Saude',
    label: 'Consultório de Psicologia',
    specialty: 'Psicóloga',
    services: [{ name: 'Sessão de psicoterapia', description: 'Sessão individual.', durationMinutes: 50, priceCents: 16000, bufferAfterMinutes: 10 }],
  },
  fonoaudiologia: {
    category: 'Saude',
    label: 'Clínica de Fonoaudiologia',
    specialty: 'Fonoaudióloga',
    services: [{ name: 'Sessão de fonoaudiologia', description: 'Sessão individual.', durationMinutes: 40, priceCents: 13000 }],
  },
} as const

type KindKey = keyof typeof KINDS

// 23 de Beleza e 4 de Saúde, além dos 3 originais.
const GENERATED_KINDS: KindKey[] = [
  ...Array<KindKey>(7).fill('barbearia'),
  ...Array<KindKey>(7).fill('salao'),
  ...Array<KindKey>(5).fill('esmalteria'),
  ...Array<KindKey>(4).fill('estetica'),
  'fisioterapia',
  'nutricao',
  'psicologia',
  'fonoaudiologia',
]

/** Pontos dos bairros, do Nominatim (OpenStreetMap), consultados em 27/10/2026. */
const BAIRROS = [
  { name: 'Vila Araceli', latitude: -22.224207, longitude: -49.6536966 },
  { name: 'Cascata', latitude: -22.202021, longitude: -49.6528534 },
  { name: 'Jardim Ecoville', latitude: -22.2304392, longitude: -49.640451 },
  { name: 'Jardim Sol Nascente', latitude: -22.2109354, longitude: -49.68169 },
  { name: 'Labienópolis', latitude: -22.2176256, longitude: -49.6568871 },
  { name: 'Vila Mariana', latitude: -22.1986906, longitude: -49.6514849 },
  { name: 'Vila Rebelo', latitude: -22.2088776, longitude: -49.6669187 },
] as const

const FIRST_NAMES = [
  'Ana', 'Bruno', 'Camila', 'Daniel', 'Eduarda', 'Felipe', 'Gabriela', 'Henrique', 'Isabela', 'João',
  'Karina', 'Lucas', 'Mariana', 'Nicolas', 'Olívia', 'Pedro', 'Rafaela', 'Samuel', 'Tatiane', 'Vinícius',
  'Yasmin', 'Larissa', 'Mateus', 'Beatriz', 'Gustavo', 'Letícia', 'Rodrigo', 'Juliana', 'Thiago', 'Paula',
] as const
const SURNAMES = [
  'Almeida', 'Barros', 'Campos', 'Duarte', 'Esteves', 'Faria', 'Gomes', 'Lacerda', 'Moraes', 'Nogueira',
  'Pacheco', 'Queiroz', 'Ramos', 'Siqueira', 'Teixeira', 'Vasconcelos', 'Xavier', 'Andrade', 'Brandão', 'Coelho',
  'Dantas', 'Freitas', 'Guedes', 'Lima', 'Macedo', 'Pires', 'Rezende', 'Sales',
] as const

const slug = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.|\.$/g, '')

/**
 * Um estabelecimento de Saúde que fica EM ANÁLISE de propósito, para demonstrar a aprovação do Admin. O seed o cria e o
 * envia, mas NUNCA o aprova (a aprovação automática o pula) e ele não entra em `BUSINESSES`: não aparece na busca nem
 * entra nas contagens, na agenda de hoje ou no histórico, então os estabelecimentos visíveis ficam como estavam.
 */
const PENDING_REVIEW_DEMO: DemoBusiness = {
  owner: { fullName: 'Novo Dono', email: 'dono.novo@example.com' },
  name: 'Clínica Nova Esperança',
  cnpjRoot: '998887770001',
  category: 'Saude',
  autoConfirm: false,
  address: { street: 'Rua Dr. Baeta Neves', streetNumber: '250', district: 'Centro', city: 'Garça', state: 'SP', postalCode: '17400000' },
  location: { latitude: -22.2118, longitude: -49.6571 },
  professionals: [
    { displayName: 'Dra. Carla Nunes', specialty: 'Psicóloga', bio: 'Atendimento clínico de adultos.', isMe: true, pattern: 0 },
  ],
  services: [{ name: 'Sessão de psicoterapia', description: 'Sessão individual.', durationMinutes: 50, priceCents: 16000, bufferAfterMinutes: 10 }],
}

/** Os 3 estabelecimentos do seed anterior, mantidos (com mais profissionais) para o script seguir idempotente. */
const ORIGINAL: DemoBusiness[] = [
  {
    owner: { fullName: 'Duartina Souza', email: 'dono.duartina@example.com' },
    name: 'Estúdio Duartina',
    cnpjRoot: '112223330001',
    category: 'Beleza',
    autoConfirm: false,
    address: { street: 'Rua Carlos Ferrari', streetNumber: '100', district: 'Centro', city: 'Garça', state: 'SP', postalCode: '17400000' },
    location: { latitude: -22.2125, longitude: -49.6564 },
    professionals: [
      { displayName: 'Duartina Souza', specialty: 'Cabeleireira', bio: 'Cortes e coloração há 12 anos.', isMe: true, pattern: 0 },
      { displayName: 'Marcos Lima', specialty: 'Barbeiro', bio: 'Especialista em barba e degradê.', isMe: false, pattern: 1 },
      { displayName: 'Paula Ramos', specialty: 'Cabeleireira', bio: 'Escova e hidratação.', isMe: false, pattern: 3 },
    ],
    services: [
      { name: 'Corte masculino', description: 'Corte na tesoura ou máquina, com finalização.', durationMinutes: 30, priceCents: 4500 },
      { name: 'Corte + barba', description: 'Corte completo e barba com toalha quente.', durationMinutes: 60, priceCents: 8000 },
      { name: 'Barba', description: 'Barba modelada com navalha.', durationMinutes: 20, priceCents: 3000 },
    ],
  },
  {
    owner: { fullName: 'Helena Prado', email: 'dono.helena@example.com' },
    name: 'Espaço Helena Unhas',
    cnpjRoot: '445556660001',
    category: 'Beleza',
    autoConfirm: true,
    address: { street: 'Avenida Rafael Paes de Barros', streetNumber: '520', district: 'Jardim Paulista', city: 'Garça', state: 'SP', postalCode: '17400000' },
    location: { latitude: -22.2068, longitude: -49.6611 },
    professionals: [
      { displayName: 'Helena Prado', specialty: 'Manicure', bio: 'Unhas em gel e esmaltação.', isMe: true, pattern: 0 },
      { displayName: 'Yasmin Coelho', specialty: 'Manicure', bio: 'Pedicure e spa dos pés.', isMe: false, pattern: 2 },
      { displayName: 'Letícia Dantas', specialty: 'Manicure', bio: 'Nail art.', isMe: false, pattern: 1 },
    ],
    services: [
      { name: 'Manicure', description: 'Cutilagem e esmaltação.', durationMinutes: 45, priceCents: 3500 },
      { name: 'Pé e mão', description: 'Manicure e pedicure.', durationMinutes: 90, priceCents: 6000 },
    ],
  },
  {
    owner: { fullName: 'Rogério Antunes', email: 'dono.rogerio@example.com' },
    name: 'Barbearia do Rogério',
    cnpjRoot: '778889990001',
    category: 'Beleza',
    autoConfirm: false,
    address: { street: 'Rua Barão do Rio Branco', streetNumber: '45', district: 'Vila Willi', city: 'Garça', state: 'SP', postalCode: '17400000' },
    location: { latitude: -22.2167, longitude: -49.6502 },
    professionals: [
      { displayName: 'Rogério Antunes', specialty: 'Barbeiro', bio: 'Barbearia clássica desde 2010.', isMe: true, pattern: 0 },
      { displayName: 'Tiago Melo', specialty: 'Barbeiro', bio: 'Cortes modernos e pigmentação.', isMe: false, pattern: 1 },
      { displayName: 'Samuel Pires', specialty: 'Barbeiro', bio: 'Degradê e navalhado.', isMe: false, pattern: 3 },
      { displayName: 'Gustavo Lima', specialty: 'Barbeiro', bio: 'Barba e acabamento.', isMe: false, pattern: 2 },
    ],
    services: [
      { name: 'Corte masculino', description: 'Corte e lavagem.', durationMinutes: 40, priceCents: 4000 },
      { name: 'Barba', description: 'Barba completa.', durationMinutes: 30, priceCents: 3500 },
    ],
  },
]

function generatedBusinesses(): DemoBusiness[] {
  const random = seededRandom(20261027)
  const usedNames = new Set<string>()

  return GENERATED_KINDS.map((kindKey, index) => {
    const kind = KINDS[kindKey]
    const bairro = BAIRROS[index % BAIRROS.length]!
    const ownerFirst = FIRST_NAMES[(index * 7) % FIRST_NAMES.length]!
    const ownerLast = SURNAMES[(index * 5) % SURNAMES.length]!

    let name = `${kind.label} ${ownerLast}`
    if (usedNames.has(name)) name = `${kind.label} ${ownerFirst} ${ownerLast}`
    usedNames.add(name)

    // Até ~300 m do ponto do bairro, para lados variados.
    const dLat = ((random() - 0.5) * 2 * 300) / 111_000
    const dLon = ((random() - 0.5) * 2 * 300) / (111_000 * Math.cos((bairro.latitude * Math.PI) / 180))

    const count = 3 + Math.floor(random() * 3)
    const professionals: DemoProfessional[] = Array.from({ length: count }, (_, p) => {
      const first = p === 0 ? ownerFirst : FIRST_NAMES[(index * 11 + p * 3) % FIRST_NAMES.length]!
      const last = p === 0 ? ownerLast : SURNAMES[(index * 3 + p * 7) % SURNAMES.length]!
      return { displayName: `${first} ${last}`, specialty: kind.specialty, bio: `${kind.specialty} na equipe.`, isMe: p === 0, pattern: (index + p) % PATTERNS.length }
    })

    const services = kind.services.filter((_, s) => s === 0 || random() > 0.2)

    return {
      owner: { fullName: `${ownerFirst} ${ownerLast}`, email: `dono.${slug(name)}@example.com` },
      name,
      cnpjRoot: String(900_000_000_000 + index * 1_013).slice(0, 12),
      category: kind.category,
      autoConfirm: random() < 0.4,
      address: {
        street: 'Rua de Demonstração',
        streetNumber: String(100 + index * 10),
        district: bairro.name,
        city: 'Garça',
        state: 'SP',
        postalCode: '17400000',
      },
      location: { latitude: bairro.latitude + dLat, longitude: bairro.longitude + dLon },
      professionals,
      services: services.map((s) => ({ ...s })),
    }
  })
}

const BUSINESSES: DemoBusiness[] = [...ORIGINAL, ...generatedBusinesses()]

const CUSTOMER = { fullName: 'Ana Consumidora', email: 'consumidor@example.com', birthDate: '1995-05-10' }

/** Admin da plataforma de demonstração — credencial de teste do ambiente local, como as outras. */
const ADMIN = { fullName: 'Admin de Demonstração', email: 'admin@example.com' }

const today = new Date().toISOString().slice(0, 10)

/** Cadastra e entra. `null` se a conta já existia — o seed já rodou. */
async function registerAndLogin(fullName: string, email: string, password = DEMO_PASSWORD): Promise<string | null> {
  try {
    await call('POST', '/api/auth/register', { email, password, fullName })
  } catch (error) {
    if (error instanceof ApiCallError && error.code === 'user.email_already_registered') return null
    throw error
  }
  confirmEmail(email)
  const auth = await call<{ accessToken: string }>('POST', '/api/auth/login', { email, password })
  return auth.accessToken
}

async function seedBusiness(demo: DemoBusiness) {
  console.log(`• ${demo.name} (${demo.category}, ${demo.address.district})`)
  const userToken = await registerAndLogin(demo.owner.fullName, demo.owner.email)
  if (!userToken) {
    console.log('  já existe — pulando')
    return
  }

  let business: { id: string }
  try {
    business = await call<{ id: string }>(
      'POST',
      '/api/businesses',
      { name: demo.name, document: cnpjFrom(demo.cnpjRoot), category: demo.category },
      userToken,
    )
  } catch (error) {
    // Banco de um seed antigo (e-mails em exemplo.com): o CNPJ já está lá, com outro dono.
    if (error instanceof ApiCallError && error.code === 'business.document_already_registered') {
      console.log('  CNPJ já cadastrado por um seed anterior — pulando')
      return
    }
    throw error
  }

  // O token precisa carregar o estabelecimento ativo para as rotas `businesses/current` (ADR-004).
  const { accessToken: token } = await call<{ accessToken: string }>(
    'POST',
    '/api/users/me/context',
    { businessId: business.id },
    userToken,
  )

  await call('PUT', '/api/businesses/current/address', demo.address, token)
  await call('PUT', '/api/businesses/current/location', { ...demo.location, precision: 'Rooftop', source: 'seed-demo' }, token)
  await call(
    'PUT',
    '/api/businesses/current/scheduling-policy',
    {
      autoConfirm: demo.autoConfirm,
      pendingExpirationHours: 12,
      minLeadTimeHours: 2,
      bookingHorizonDays: 60,
      cancellationWindowHours: 24,
      timeZone: TIME_ZONE,
    },
    token,
  )

  const professionalIds: string[] = []
  for (const professional of demo.professionals) {
    // A API só cria o perfil do próprio dono: os outros nascem no aceite do convite. Na demonstração (dados fictícios)
    // eles entram por SQL, só no banco local do Docker, como registros sem conta, com a declaração do dono (ADR-031).
    const created = professional.isMe
      ? await call<{ id: string }>('POST', '/api/businesses/current/professionals', professional, token)
      : { id: insertDemoProfessional(business.id, professional) }
    professionalIds.push(created.id)

    for (const { day, start, end } of PATTERNS[professional.pattern]!) {
      await call(
        'POST',
        '/api/businesses/current/work-schedules',
        { professionalId: created.id, dayOfWeek: day, startTime: start, endTime: end, effectiveFrom: daysFromToday(-70), effectiveTo: null },
        token,
      )
    }
  }

  for (const service of demo.services) {
    const created = await call<{ id: string }>(
      'POST',
      '/api/businesses/current/services',
      {
        name: service.name,
        description: service.description,
        durationMinutes: service.durationMinutes,
        priceCents: service.priceCents,
        bufferBeforeMinutes: 0,
        bufferAfterMinutes: service.bufferAfterMinutes ?? 0,
        slotStepMinutes: 15,
        suppliesNote: null,
        isActive: true,
      },
      token,
    )
    for (const professionalId of professionalIds) {
      await call(
        'PUT',
        `/api/businesses/current/services/${created.id}/professionals/${professionalId}`,
        { priceOverrideCents: null, durationOverrideMinutes: null },
        token,
      )
    }
  }

  // A checklist de envio exige os termos aceitos e, em Saúde, o responsável (Fase 3). Dados fictícios da demonstração.
  await call('POST', '/api/businesses/current/terms', { version: '2026-11' }, token)
  if (demo.category === 'Saude') {
    await call(
      'PUT',
      '/api/businesses/current/responsible',
      { name: 'Responsável de demonstração', council: 'Crm', councilNumber: '123456', councilState: 'SP' },
      token,
    )
  }

  await call('POST', '/api/businesses/current/submit', undefined, token)
  console.log('  criado e enviado para revisão')
}

/** A jornada vale desde antes do histórico, para os 60 dias de passado caírem dentro dela. */
function daysFromToday(days: number): string {
  const date = new Date(`${today}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

async function seedCustomer() {
  console.log(`• Consumidor ${CUSTOMER.email}`)
  const token = await registerAndLogin(CUSTOMER.fullName, CUSTOMER.email)
  if (!token) {
    console.log('  já existe — pulando')
    return
  }
  await call('POST', '/api/customers/me', { birthDate: CUSTOMER.birthDate, socialName: null }, token)
  console.log('  criado com perfil de consumidor')
}

// --- Banco local (docker compose) ---------------------------------------------------------------------

/** Roda SQL no container `db`. Só no banco local do Docker. */
function psql(sql: string, options: { quiet?: boolean } = {}): string {
  const result = Bun.spawnSync(
    ['docker', 'compose', 'exec', '-T', 'db', 'sh', '-c', 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -1 -tA -q -f -'],
    { stdin: Buffer.from(sql, 'utf8'), stdout: 'pipe', stderr: 'pipe' },
  )
  if (result.exitCode !== 0) {
    throw new Error(`Falha no SQL: ${result.stderr.toString().slice(0, 2000)}`)
  }
  const out = result.stdout.toString().trim()
  if (!options.quiet && result.stderr.length > 0) console.log(result.stderr.toString().trim())
  return out
}

const sqlText = (value: string | null | undefined) => (value == null ? 'NULL' : `'${value.replace(/'/g, "''")}'`)

/** Profissional fictício sem conta, com a declaração do dono do estabelecimento. Devolve o id. */
function insertDemoProfessional(businessId: string, professional: DemoProfessional): string {
  return psql(`
    INSERT INTO people.professional
      (id, business_id, display_name, specialty, bio, is_active, created_at,
       authorization_declared_at, authorization_declaration_version, authorization_declared_by_user_id)
    SELECT gen_random_uuid(), ${sqlText(businessId)}::uuid, ${sqlText(professional.displayName)}, ${sqlText(professional.specialty)},
      ${sqlText(professional.bio)}, true, now(), now(), 'seed-demo', m.user_id
    FROM tenancy.business_membership m
    WHERE m.business_id = ${sqlText(businessId)}::uuid AND m.role = 'Owner'
    RETURNING id;
  `)
}

/**
 * O papel de Admin da plataforma nunca é concedido por endpoint (ADR-020): só por SQL no banco. Esta é a única
 * escrita direta do seed fora do histórico, e só no banco local do Docker.
 */
function grantPlatformAdmin(email: string) {
  psql(`UPDATE identity."user" SET is_platform_admin = true WHERE email = ${sqlText(email)};`)
}

/**
 * O login exige e-mail confirmado (Onda 6A). As contas de demonstração usam domínio `example.com`, que não recebe
 * e-mail: o seed confirma por SQL, como faz com o Admin, e só no banco local do Docker.
 */
function confirmEmail(email: string) {
  psql(`UPDATE identity."user" SET email_confirmed_at = now() WHERE email = ${sqlText(email)} AND email_confirmed_at IS NULL;`)
}

/**
 * O Admin de demonstração aprova pela API tudo o que estiver em análise. Devolve se a conta foi criada agora (só
 * então a senha aleatória vale e é mostrada).
 */
async function approvePendingBusinesses(): Promise<boolean> {
  console.log(`• Admin ${ADMIN.email}`)
  const created = (await registerAndLogin(ADMIN.fullName, ADMIN.email, ADMIN_PASSWORD)) !== null
  grantPlatformAdmin(ADMIN.email)

  if (!created && !ADMIN_PASSWORD_FROM_ENV) {
    // A senha aleatória desta execução não é a da conta que já existia; a dela não muda.
    console.log('  já existia — a senha dele não mudou; para aprovar o que estiver em análise, defina SEED_ADMIN_PASSWORD')
    return false
  }

  // O token só carrega o papel depois de concedido: entra de novo.
  const { accessToken } = await call<{ accessToken: string }>('POST', '/api/auth/login', { email: ADMIN.email, password: ADMIN_PASSWORD })

  const pending = await call<{ items: { id: string; name: string }[] }>(
    'GET',
    '/api/admin/businesses?status=PendingReview&pageSize=100',
    undefined,
    accessToken,
  )
  // O de Saúde pendente fica como está: é o que a demonstração do Admin aprova ao vivo.
  const toApprove = pending.items.filter((business) => business.name !== PENDING_REVIEW_DEMO.name)
  for (const business of toApprove) {
    await call('POST', `/api/admin/businesses/${business.id}/approve`, { note: 'Aprovado pelo seed de demonstração' }, accessToken)
  }
  console.log(toApprove.length === 0 ? '  nada em análise' : `  ${toApprove.length} aprovados`)
  return created
}

/**
 * O ambiente da API que vai receber os dados, lido do próprio contêiner. Sem conseguir ler, vale o mais restrito:
 * fora de Development.
 */
function apiEnvironment(): string {
  const result = Bun.spawnSync(['docker', 'compose', 'exec', '-T', 'api', 'printenv', 'ASPNETCORE_ENVIRONMENT'], {
    stdout: 'pipe',
    stderr: 'pipe',
  })
  return (result.exitCode === 0 && result.stdout.toString().trim()) || 'Production'
}

/** A senha padrão está no repositório: numa instância aberta, qualquer um entraria nas contas de demonstração. */
function refuseDefaultPasswordOutsideDevelopment() {
  const environment = apiEnvironment()
  if (environment === 'Development' || ALLOW_DEFAULT_PASSWORD) return

  const offending = [
    DEMO_PASSWORD === DEFAULT_PASSWORD && 'SEED_PASSWORD',
    ADMIN_PASSWORD === DEFAULT_PASSWORD && 'SEED_ADMIN_PASSWORD',
  ].filter(Boolean)
  if (offending.length > 0) {
    throw new Error(
      `A API está em ${environment}, e ${offending.join(' e ')} está com a senha padrão do repositório. ` +
        'Defina uma senha própria (ver .env.example), ou rode com --permitir-senha-padrao sabendo que qualquer um entra.',
    )
  }
}

// --- Agenda de hoje e amanhã (sem --historico) --------------------------------------------------------

const AGENDA_BUSINESSES = 3
const WALK_IN_NAMES = ['Joana Pereira', 'Carlos Menezes']

type Slots = { slots: string[] }

const login = async (email: string) =>
  (await call<{ accessToken: string }>('POST', '/api/auth/login', { email, password: DEMO_PASSWORD })).accessToken

/**
 * Sem histórico, o painel abre vazio. Para a banca ver algo ao entrar, os 3 primeiros estabelecimentos ganham,
 * pela própria API (com as regras de horário de verdade), duas marcações de balcão hoje e dois pedidos da
 * consumidora de demonstração amanhã — pendentes onde a confirmação não é automática. Pula o estabelecimento
 * que já tem agendamento hoje ou amanhã: reexecutar no mesmo dia não duplica.
 */
async function seedTodayAgenda() {
  console.log('• Agenda de hoje e amanhã (3 primeiros estabelecimentos)')
  const customerToken = await login(CUSTOMER.email)

  for (const [index, demo] of BUSINESSES.slice(0, AGENDA_BUSINESSES).entries()) {
    const userToken = await login(demo.owner.email)
    const me = await call<{ businesses: { businessId: string }[] }>('GET', '/api/users/me', undefined, userToken)
    const businessId = me.businesses[0]?.businessId
    if (!businessId) continue
    const { accessToken: owner } = await call<{ accessToken: string }>('POST', '/api/users/me/context', { businessId }, userToken)

    const days = [daysFromToday(0), daysFromToday(1)]
    const existing = await Promise.all(
      days.map((date) => call<{ totalCount: number }>('GET', `/api/businesses/current/appointments?date=${date}`, undefined, owner)),
    )
    if (existing.some(({ totalCount }) => totalCount > 0)) {
      console.log(`  ${demo.name}: já tem agenda — pulando`)
      continue
    }

    const services = await call<{ items: { id: string; professionals: { professionalId: string }[] }[] }>(
      'GET',
      `/api/businesses/${businessId}/services?pageSize=50`,
    )
    const offers = services.items.flatMap((service) =>
      service.professionals.map(({ professionalId }) => ({ serviceId: service.id, professionalId })),
    )
    const slotsOf = async (offer: (typeof offers)[number], date: string) =>
      (
        await call<Slots>(
          'GET',
          `/api/businesses/${businessId}/availability?serviceId=${offer.serviceId}&professionalId=${offer.professionalId}&date=${date}`,
        )
      ).slots

    let counter = 0
    let requested = 0
    // Hoje: balcão, com profissionais diferentes. Amanhã: pedidos online.
    for (const [n, offer] of offers.slice(0, 2).entries()) {
      const startsAt = (await slotsOf(offer, days[0]!))[n * 2]
      if (!startsAt) continue
      await call(
        'POST',
        '/api/businesses/current/appointments/counter',
        { ...offer, startsAt, walkInName: WALK_IN_NAMES[n]!, walkInPhone: null, notes: null },
        owner,
      )
      counter++
    }
    const tomorrowOffers = [offers[0], offers.find((o) => o.professionalId !== offers[0]?.professionalId)].filter(
      (o): o is (typeof offers)[number] => o !== undefined,
    )
    for (const [n, offer] of tomorrowOffers.entries()) {
      const startsAt = (await slotsOf(offer, days[1]!))[n * 3]
      if (!startsAt) continue
      await call(
        'POST',
        '/api/appointments',
        { businessId, ...offer, startsAt, notes: null, attendeeName: null, idempotencyKey: `seed-agenda-${days[1]}-${index}-${n}` },
        customerToken,
      )
      requested++
    }
    console.log(`  ${demo.name}: ${counter} no balcão hoje, ${requested} ${demo.autoConfirm ? 'confirmados' : 'pendentes'} amanhã`)
  }
}

// --- Histórico (--historico) --------------------------------------------------------------------------

const HISTORY_MARKER = 'Histórico de demonstração'
const HISTORY_DAYS_BACK = 60
const FUTURE_DAYS = 14
const HISTORY_CUSTOMERS = 60

/** UUID v7: os 48 bits mais altos são o instante em ms (ADR-010, decisão 3). */
function uuidV7(random: () => number, at: number): string {
  const bytes = new Uint8Array(16)
  let ms = at
  for (let i = 5; i >= 0; i--) {
    bytes[i] = ms % 256
    ms = Math.floor(ms / 256)
  }
  for (let i = 6; i < 16; i++) bytes[i] = Math.floor(random() * 256)
  bytes[6] = (bytes[6]! & 0x0f) | 0x70
  bytes[8] = (bytes[8]! & 0x3f) | 0x80
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

/** Feriados nacionais (o mesmo critério de `BrazilianHolidays`): fechado, sem agendamento. */
function isNationalHoliday(date: string): boolean {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number]
  const fixed = ['01-01', '04-21', '05-01', '09-07', '10-12', '11-02', '11-15', '11-20', '12-25']
  if (fixed.includes(date.slice(5))) return true
  const a = y % 19
  const b = Math.floor(y / 100)
  const c = y % 100
  const h = (19 * a + b - Math.floor(b / 4) - Math.floor((b - Math.floor((b + 8) / 25) + 1) / 3) + 15) % 30
  const l = (32 + 2 * (b % 4) + 2 * Math.floor(c / 4) - h - (c % 4)) % 7
  const mm = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * mm + 114) / 31)
  const day = ((h + l - 7 * mm + 114) % 31) + 1
  const goodFriday = new Date(Date.UTC(y, month - 1, day - 2))
  return goodFriday.getUTCMonth() + 1 === m && goodFriday.getUTCDate() === d
}

type HistorySource = {
  businesses: { id: string; tz: string; category: string }[]
  offers: { business_id: string; professional_id: string; service_id: string; name: string; duration: number; buffer_before: number; buffer_after: number; price: number }[]
  schedules: { professional_id: string; day: number; start: string; end: string }[]
  demo_customer_hash: string | null
}

function seedHistory() {
  console.log('\n• Histórico (SQL direto, só banco local)')

  const already = Number(psql(`SELECT count(*) FROM scheduling.appointment WHERE customer_notes = ${sqlText(HISTORY_MARKER)};`))
  if (already > 0) {
    console.log(`  já existe (${already} agendamentos) — pulando`)
    return
  }

  const source = JSON.parse(
    psql(`
      WITH seeded AS (
        SELECT b.id, b.time_zone, b.category FROM tenancy.business b
        JOIN tenancy.business_membership m ON m.business_id = b.id AND m.role = 'Owner'
        JOIN identity."user" u ON u.id = m.user_id
        WHERE u.email LIKE 'dono.%@example.com' AND b.status = 'Active')
      SELECT json_build_object(
        'businesses', (SELECT coalesce(json_agg(json_build_object('id', id, 'tz', time_zone, 'category', category)), '[]') FROM seeded),
        'offers', (SELECT coalesce(json_agg(json_build_object(
            'business_id', s.business_id, 'professional_id', sp.professional_id, 'service_id', s.id, 'name', s.name,
            'duration', coalesce(sp.duration_override_minutes, s.duration_minutes),
            'buffer_before', s.buffer_before_minutes, 'buffer_after', s.buffer_after_minutes,
            'price', coalesce(sp.price_override_cents, s.price_cents))), '[]')
          FROM catalog.service s JOIN catalog.service_professional sp ON sp.service_id = s.id
          WHERE s.is_active AND s.business_id IN (SELECT id FROM seeded)),
        'schedules', (SELECT coalesce(json_agg(json_build_object(
            'professional_id', w.professional_id, 'day', w.day_of_week, 'start', w.start_time, 'end', w.end_time)), '[]')
          FROM availability.work_schedule w WHERE w.business_id IN (SELECT id FROM seeded) AND w.effective_to IS NULL),
        'demo_customer_hash', (SELECT password_hash FROM identity."user" WHERE email = ${sqlText(CUSTOMER.email)}));
    `),
  ) as HistorySource

  if (source.businesses.length === 0) throw new Error('Nenhum estabelecimento de demonstração ativo. Rode o seed sem --historico antes.')
  if (!source.demo_customer_hash) throw new Error(`A conta ${CUSTOMER.email} não existe. Rode o seed sem --historico antes.`)

  // Horários que já têm agendamento (a agenda de hoje e as avaliações de um seed anterior): o histórico desvia deles,
  // senão a constraint de exclusão derruba a transação inteira ao rodar --historico depois do seed normal.
  const reserved = (
    JSON.parse(
      psql(`SELECT coalesce(json_agg(json_build_object('p', professional_id, 's', blocked_starts_at, 'e', blocked_ends_at)), '[]')
            FROM scheduling.appointment;`),
    ) as { p: string; s: string; e: string }[]
  ).map((slot) => ({ professionalId: slot.p, from: Date.parse(slot.s), to: Date.parse(slot.e) }))

  const random = seededRandom(1027)
  const now = Date.now()
  const lines: string[] = []

  // Consumidores fictícios do histórico: mesma senha de teste da conta de demonstração (o hash é copiado).
  const customers: { userId: string; customerId: string; name: string }[] = []
  const userRows: string[] = []
  const customerRows: string[] = []
  for (let i = 1; i <= HISTORY_CUSTOMERS; i++) {
    const name = `${pick(random, FIRST_NAMES)} ${pick(random, SURNAMES)}`
    const userId = uuidV7(random, now - 90 * 86_400_000 + i * 1000)
    const customerId = uuidV7(random, now - 90 * 86_400_000 + i * 1000 + 1)
    const birth = `${1960 + Math.floor(random() * 45)}-${String(1 + Math.floor(random() * 12)).padStart(2, '0')}-${String(1 + Math.floor(random() * 28)).padStart(2, '0')}`
    customers.push({ userId, customerId, name })
    userRows.push(`('${userId}', ${sqlText(`consumidor.hist.${String(i).padStart(2, '0')}@example.com`)}, ${sqlText(source.demo_customer_hash)}, ${sqlText(name)}, 'Active', now())`)
    customerRows.push(`('${customerId}', '${userId}', '${birth}', now())`)
  }
  lines.push(`INSERT INTO identity."user" (id, email, password_hash, full_name, status, created_at) VALUES\n${userRows.join(',\n')};`)
  lines.push(`INSERT INTO people.customer (id, user_id, birth_date, created_at) VALUES\n${customerRows.join(',\n')};`)

  const appointmentRows: string[] = []
  const eventRows: string[] = []
  const iso = (ms: number) => `'${new Date(ms).toISOString()}'`
  const minute = 60_000

  const event = (businessId: string, appointmentId: string, from: string | null, to: string, actorId: string | null, role: string, at: number) => {
    eventRows.push(`('${uuidV7(random, at)}', '${businessId}', '${appointmentId}', ${sqlText(from)}, '${to}', ${actorId ? `'${actorId}'` : 'NULL'}, '${role}', ${iso(at)}, NULL)`)
  }

  for (const business of source.businesses) {
    const sensitive = business.category === 'Saude'
    const offersByProfessional = new Map<string, HistorySource['offers']>()
    for (const offer of source.offers.filter((o) => o.business_id === business.id)) {
      offersByProfessional.set(offer.professional_id, [...(offersByProfessional.get(offer.professional_id) ?? []), offer])
    }

    for (const [professionalId, offers] of offersByProfessional) {
      const windows = source.schedules.filter((s) => s.professional_id === professionalId)

      for (let offset = -HISTORY_DAYS_BACK; offset <= FUTURE_DAYS; offset++) {
        const date = daysFromToday(offset)
        if (isNationalHoliday(date)) continue
        const weekday = new Date(`${date}T12:00:00Z`).getUTCDay()
        // Passado mais cheio; futuro vai esvaziando — "parcialmente ocupado".
        const fill = offset < 0 ? 0.55 : Math.max(0.12, 0.5 - offset * 0.03)

        for (const window of windows.filter((w) => w.day === weekday)) {
          let cursor = zonedToUtc(date, window.start, business.tz).getTime()
          const windowEnd = zonedToUtc(date, window.end, business.tz).getTime()

          while (cursor < windowEnd) {
            const offer = pick(random, offers)
            const blockedStart = cursor
            const startsAt = blockedStart + offer.buffer_before * minute
            const endsAt = startsAt + offer.duration * minute
            const blockedEnd = endsAt + offer.buffer_after * minute

            if (blockedEnd > windowEnd) break
            if (reserved.some((slot) => slot.professionalId === professionalId && slot.from < blockedEnd && slot.to > blockedStart)) {
              cursor = blockedEnd
              continue
            }
            if (random() > fill) {
              cursor += 30 * minute
              continue
            }

            const inPast = endsAt < now
            if (!inPast && startsAt < now + 3 * 60 * minute) {
              cursor = blockedEnd
              continue
            }

            const id = uuidV7(random, startsAt - 5 * 86_400_000)
            const atCounter = random() < 0.15
            const customer = atCounter ? null : pick(random, customers)
            const requestedAt = atCounter
              ? startsAt - Math.floor(1 + random() * 48) * 60 * minute
              : inPast
                ? startsAt - Math.floor(1 + random() * 10) * 86_400_000
                : Math.min(now - Math.floor(random() * 6) * 60 * minute, startsAt - 3 * 60 * minute)

            let status: string
            let confirmedAt: number | null = null
            let cancelledAt: number | null = null
            let completedAt: number | null = null
            let cancelledBy: string | null = null
            let reason: string | null = null
            let expiresAt: number | null = null
            const actor = customer?.userId ?? null

            if (atCounter) {
              confirmedAt = requestedAt
              event(business.id, id, null, 'Confirmed', null, 'Owner', requestedAt)
            } else {
              event(business.id, id, null, 'Pending', actor, 'Customer', requestedAt)
            }

            if (inPast) {
              const r = random()
              if (r < 0.76) status = 'Completed'
              else if (r < 0.88) status = 'Cancelled'
              else if (r < 0.96) status = 'NoShow'
              else if (r < 0.98 && !atCounter) status = 'Expired'
              else status = atCounter ? 'Completed' : 'Rejected'

              if (status === 'Expired') {
                cancelledBy = 'System'
                event(business.id, id, 'Pending', 'Expired', null, 'System', requestedAt + 12 * 60 * minute)
              } else if (status === 'Rejected') {
                reason = 'Horário indisponível'
                event(business.id, id, 'Pending', 'Rejected', null, 'Owner', requestedAt + 60 * minute)
              } else {
                if (!atCounter) {
                  confirmedAt = requestedAt + 30 * minute
                  event(business.id, id, 'Pending', 'Confirmed', null, 'Owner', confirmedAt)
                }
                if (status === 'Completed') {
                  completedAt = endsAt
                  event(business.id, id, 'Confirmed', 'Completed', null, 'Owner', endsAt)
                } else if (status === 'NoShow') {
                  event(business.id, id, 'Confirmed', 'NoShow', null, 'Owner', endsAt + 10 * minute)
                } else {
                  const byCustomer = !atCounter && random() < 0.7
                  cancelledBy = byCustomer ? 'Customer' : 'Business'
                  reason = byCustomer ? 'Imprevisto' : 'Profissional indisponível'
                  cancelledAt = startsAt - Math.floor(25 + random() * 48) * 60 * minute
                  event(business.id, id, 'Confirmed', 'Cancelled', byCustomer ? actor : null, byCustomer ? 'Customer' : 'Owner', cancelledAt)
                }
              }
            } else if (atCounter || random() < 0.65) {
              status = 'Confirmed'
              if (!atCounter) {
                confirmedAt = requestedAt + 30 * minute
                event(business.id, id, 'Pending', 'Confirmed', null, 'Owner', confirmedAt)
              }
            } else {
              status = 'Pending'
              expiresAt = Math.min(requestedAt + 12 * 60 * minute, startsAt - 2 * 60 * minute)
            }

            appointmentRows.push(
              `('${id}', '${business.id}', '${professionalId}', '${offer.service_id}', ${customer ? `'${customer.customerId}'` : 'NULL'}, ` +
                `${atCounter ? sqlText(`${pick(random, FIRST_NAMES)} ${pick(random, SURNAMES)}`) : 'NULL'}, NULL, ` +
                `${iso(startsAt)}, ${iso(endsAt)}, ${iso(blockedStart)}, ${iso(blockedEnd)}, ${sqlText(offer.name)}, ` +
                `${offer.duration}, ${offer.buffer_before}, ${offer.buffer_after}, ${offer.price}, ${sensitive}, '${status}', ` +
                `'${atCounter ? 'Counter' : 'Online'}', ${sqlText(HISTORY_MARKER)}, NULL, ${iso(requestedAt)}, ` +
                `${confirmedAt ? iso(confirmedAt) : 'NULL'}, ${cancelledAt ? iso(cancelledAt) : 'NULL'}, ${completedAt ? iso(completedAt) : 'NULL'}, ` +
                `${sqlText(cancelledBy)}, ${sqlText(reason)}, ${expiresAt ? iso(expiresAt) : 'NULL'}, NULL, ${iso(requestedAt)})`,
            )

            cursor = blockedEnd
          }
        }
      }
    }
  }

  const columns =
    'id, business_id, professional_id, service_id, customer_id, walk_in_name, walk_in_phone, starts_at, ends_at, ' +
    'blocked_starts_at, blocked_ends_at, service_name_snapshot, duration_minutes, buffer_before_minutes, buffer_after_minutes, ' +
    'price_cents, is_sensitive, status, source, customer_notes, business_notes, requested_at, confirmed_at, cancelled_at, ' +
    'completed_at, cancelled_by, cancellation_reason, expires_at, idempotency_key, created_at'
  for (let i = 0; i < appointmentRows.length; i += 500) {
    lines.push(`INSERT INTO scheduling.appointment (${columns}) VALUES\n${appointmentRows.slice(i, i + 500).join(',\n')};`)
  }
  for (let i = 0; i < eventRows.length; i += 1000) {
    lines.push(
      `INSERT INTO scheduling.appointment_event (id, business_id, appointment_id, from_status, to_status, actor_user_id, actor_role, occurred_at, note) VALUES\n${eventRows.slice(i, i + 1000).join(',\n')};`,
    )
  }

  // Uma transação só (-1): ou o histórico inteiro entra, ou nada entra.
  psql(lines.join('\n'))
  console.log(`  ${HISTORY_CUSTOMERS} consumidores, ${appointmentRows.length} agendamentos, ${eventRows.length} eventos`)
}

function printCounts() {
  const counts = psql(`
    SELECT 'tenancy.business', count(*) FROM tenancy.business
    UNION ALL SELECT 'tenancy.business_membership', count(*) FROM tenancy.business_membership
    UNION ALL SELECT 'identity.user', count(*) FROM identity."user"
    UNION ALL SELECT 'people.customer', count(*) FROM people.customer
    UNION ALL SELECT 'people.professional', count(*) FROM people.professional
    UNION ALL SELECT 'catalog.service', count(*) FROM catalog.service
    UNION ALL SELECT 'catalog.service_professional', count(*) FROM catalog.service_professional
    UNION ALL SELECT 'availability.work_schedule', count(*) FROM availability.work_schedule
    UNION ALL SELECT 'scheduling.appointment', count(*) FROM scheduling.appointment
    UNION ALL SELECT 'scheduling.appointment_event', count(*) FROM scheduling.appointment_event;
    SELECT 'appointment ' || status, count(*) FROM scheduling.appointment GROUP BY status ORDER BY 1;
    SELECT 'business ' || category || ' ' || status, count(*) FROM tenancy.business GROUP BY category, status ORDER BY 1;
  `)
  console.log('\nRegistros no banco:')
  for (const line of counts.split('\n')) {
    const [table, count] = line.split('|')
    console.log(`  ${table!.padEnd(34)} ${count}`)
  }
}

/**
 * Equipe do Estúdio Duartina (Fase 4): um profissional com conta (ligado ao perfil "Marcos Lima"), um atendente e um
 * convite pendente. O convite sai pela API do dono, então o e-mail cai no Mailpit com o link verdadeiro; o seed nunca
 * toca no token. Os vínculos entram por SQL, só no banco local do Docker, como o Admin.
 */
const DUARTINA = { owner: 'dono.duartina@example.com', business: 'Estúdio Duartina', professionalProfile: 'Marcos Lima' }
const TEAM = {
  professional: { fullName: 'Marcos Lima', email: 'profissional.duartina@example.com' },
  attendant: { fullName: 'Atendente Duartina', email: 'atendente.duartina@example.com' },
  invited: { name: 'Convidado Pendente', email: 'convidado.duartina@example.com' },
  // Convite de profissional com especialidade (10/11): o perfil nasce no aceite, com ela.
  invitedProfessional: {
    name: 'Convidada Profissional',
    email: 'convidada.profissional.duartina@example.com',
    specialty: 'Manicure',
  },
}

async function seedDuartinaTeam() {
  console.log(`• Equipe do ${DUARTINA.business}`)
  const login = await call<{ accessToken: string }>('POST', '/api/auth/login', { email: DUARTINA.owner, password: DEMO_PASSWORD })
  const me = await call<{ businesses: Array<{ businessId: string; name: string }> }>('GET', '/api/users/me', undefined, login.accessToken)
  const business = me.businesses.find((candidate) => candidate.name === DUARTINA.business)
  if (!business) {
    console.log('  estabelecimento não encontrado — pulando')
    return
  }

  for (const [person, role] of [
    [TEAM.professional, 'Professional'],
    [TEAM.attendant, 'Attendant'],
  ] as const) {
    if (!(await registerAndLogin(person.fullName, person.email))) {
      console.log(`  ${person.email} já existia — pulando`)
      continue
    }
    psql(`
      INSERT INTO tenancy.business_membership (id, business_id, user_id, role, status, accepted_at, created_at)
      SELECT gen_random_uuid(), ${sqlText(business.businessId)}::uuid, u.id, ${sqlText(role)}, 'Active', now(), now()
      FROM identity."user" u
      WHERE u.email = ${sqlText(person.email)}
        AND NOT EXISTS (SELECT 1 FROM tenancy.business_membership m WHERE m.business_id = ${sqlText(business.businessId)}::uuid AND m.user_id = u.id);
    `)
    if (role === 'Professional') {
      psql(`
        UPDATE people.professional p SET business_membership_id = m.id
        FROM tenancy.business_membership m
        JOIN identity."user" u ON u.id = m.user_id
        WHERE u.email = ${sqlText(person.email)} AND m.business_id = p.business_id
          AND p.business_id = ${sqlText(business.businessId)}::uuid
          AND p.display_name = ${sqlText(DUARTINA.professionalProfile)}
          AND p.business_membership_id IS NULL;
      `)
    }
    console.log(`  ${person.email} (${role})`)
  }

  const { accessToken } = await call<{ accessToken: string }>('POST', '/api/users/me/context', { businessId: business.businessId }, login.accessToken)
  try {
    await call('POST', '/api/businesses/current/invitations', { name: TEAM.invited.name, email: TEAM.invited.email, role: 'Attendant' }, accessToken)
    console.log(`  convite pendente para ${TEAM.invited.email} (o e-mail está no Mailpit)`)
  } catch (error) {
    if (!(error instanceof ApiCallError) || error.code !== 'invitation.already_pending') throw error
    console.log('  o convite pendente já existia')
  }

  try {
    await call(
      'POST',
      '/api/businesses/current/invitations',
      { ...TEAM.invitedProfessional, role: 'Professional' },
      accessToken,
    )
    console.log(`  convite de profissional (${TEAM.invitedProfessional.specialty}) para ${TEAM.invitedProfessional.email}`)
  } catch (error) {
    if (!(error instanceof ApiCallError) || error.code !== 'invitation.already_pending') throw error
    console.log('  o convite de profissional pendente já existia')
  }
}

/**
 * Avaliações de demonstração (Fase 8, ADR-032): atendimentos concluídos nos 3 primeiros estabelecimentos, cada um com a
 * sua avaliação, e um atendimento concluído **sem** avaliação do consumidor de demonstração (para ver "Avaliar
 * atendimento" na tela). SQL direto, só no banco local do Docker, como o histórico: a API não deixa criar um
 * atendimento no passado.
 *
 * Mostra os três estados da nota: o 1º estabelecimento com 5 avaliações (média na tela), o 2º com exatamente 3 (a média
 * aparece pela primeira vez) e o 3º com 2 ("Novo"). Os outros 27 não ganham nada: a busca de sempre continua igual.
 * Os atendimentos usam o primeiro horário de expediente de dias úteis passados, um por dia, e cedem a qualquer
 * agendamento que já esteja lá (`ON CONFLICT DO NOTHING`); o histórico, por sua vez, evita estes horários.
 */
const REVIEW_MARKER = 'Avaliação de demonstração'
/** Os 3 primeiros e o primeiro de Saúde (índice 3 em `DEMO_REVIEWS`): a avaliação sem o nome do serviço, por ser dado sensível. */
const REVIEWED = [...BUSINESSES.slice(0, 3), BUSINESSES.find((business) => business.category === 'Saude')!]

const DEMO_REVIEWS: { business: number; rating: number; professionalRating: number | null; comment: string | null }[] = [
  { business: 0, rating: 5, professionalRating: 5, comment: 'Atendimento excelente e pontual.' },
  { business: 0, rating: 5, professionalRating: 5, comment: null },
  { business: 0, rating: 4, professionalRating: 4, comment: 'Gostei do resultado. O ambiente é agradável.' },
  { business: 0, rating: 5, professionalRating: null, comment: 'Voltarei com certeza.' },
  { business: 0, rating: 4, professionalRating: 5, comment: null },
  { business: 1, rating: 4, professionalRating: 4, comment: null },
  { business: 1, rating: 5, professionalRating: 5, comment: 'Muito atenciosos.' },
  { business: 1, rating: 3, professionalRating: null, comment: 'Demorou um pouco para começar.' },
  { business: 2, rating: 5, professionalRating: 5, comment: 'Recomendo.' },
  { business: 2, rating: 4, professionalRating: null, comment: null },
  { business: 3, rating: 5, professionalRating: 5, comment: 'Fui muito bem acolhida.' },
  { business: 3, rating: 5, professionalRating: 5, comment: null },
  { business: 3, rating: 4, professionalRating: null, comment: 'Pontualidade e cuidado.' },
]

/** "Ana Souza Lima" → "Ana S." (a mesma regra de `Review.DisplayNameOf`). */
const publicName = (fullName: string) => {
  const [first, second] = fullName.split(' ')
  return second ? `${first} ${second[0]!.toUpperCase()}.` : first!
}

type ReviewSource = {
  businesses: { id: string; name: string; tz: string; category: string; professional_id: string; service_id: string; service_name: string; duration: number; buffer_before: number; buffer_after: number; price: number }[]
  schedules: { professional_id: string; day: number; start: string }[]
  demo_customer_id: string | null
  demo_customer_hash: string | null
}

function seedReviews() {
  console.log('\n• Avaliações (SQL direto, só banco local)')

  const already = Number(psql(`SELECT count(*) FROM scheduling.appointment WHERE customer_notes = ${sqlText(REVIEW_MARKER)};`))
  if (already > 0) {
    console.log(`  já existem (${already} atendimentos) — pulando`)
    return
  }

  const names = REVIEWED.map((business) => business.name)
  const source = JSON.parse(
    psql(`
      WITH picked AS (
        SELECT DISTINCT ON (b.id) b.id, b.name, b.time_zone, b.category, sp.professional_id, s.id AS service_id, s.name AS service_name,
               coalesce(sp.duration_override_minutes, s.duration_minutes) AS duration, s.buffer_before_minutes AS bb,
               s.buffer_after_minutes AS ba, coalesce(sp.price_override_cents, s.price_cents) AS price
        FROM tenancy.business b
        JOIN catalog.service s ON s.business_id = b.id AND s.is_active
        JOIN catalog.service_professional sp ON sp.service_id = s.id
        WHERE b.status = 'Active' AND b.name IN (${names.map(sqlText).join(', ')})
        ORDER BY b.id, s.name, sp.professional_id)
      SELECT json_build_object(
        'businesses', (SELECT coalesce(json_agg(json_build_object(
            'id', id, 'name', name, 'tz', time_zone, 'category', category, 'professional_id', professional_id,
            'service_id', service_id, 'service_name', service_name, 'duration', duration, 'buffer_before', bb,
            'buffer_after', ba, 'price', price)), '[]') FROM picked),
        'schedules', (SELECT coalesce(json_agg(json_build_object('professional_id', w.professional_id, 'day', w.day_of_week, 'start', w.start_time)), '[]')
          FROM availability.work_schedule w WHERE w.professional_id IN (SELECT professional_id FROM picked) AND w.effective_to IS NULL),
        'demo_customer_id', (SELECT c.id FROM people.customer c JOIN identity."user" u ON u.id = c.user_id WHERE u.email = ${sqlText(CUSTOMER.email)}),
        'demo_customer_hash', (SELECT password_hash FROM identity."user" WHERE email = ${sqlText(CUSTOMER.email)}));
    `),
  ) as ReviewSource

  if (!source.demo_customer_id || !source.demo_customer_hash) {
    console.log(`  a conta ${CUSTOMER.email} não existe — pulando`)
    return
  }
  const orderedBusinesses = names.flatMap((name) => source.businesses.filter((business) => business.name === name))
  if (orderedBusinesses.length < REVIEWED.length) {
    console.log('  os estabelecimentos avaliados ainda não estão ativos — pulando')
    return
  }

  const random = seededRandom(2026)
  const now = Date.now()
  const minute = 60_000
  const iso = (ms: number) => `'${new Date(ms).toISOString()}'::timestamptz`
  const uuid = (id: string) => `'${id}'::uuid`

  /** Os próximos dias úteis do profissional, do mais recente ao mais antigo, com o instante do primeiro expediente. */
  const workdays = (business: ReviewSource['businesses'][number]) => {
    const found: number[] = []
    for (let back = 1; back <= 28 && found.length < 8; back++) {
      const date = daysFromToday(-back)
      if (isNationalHoliday(date)) continue
      const weekday = new Date(`${date}T12:00:00Z`).getUTCDay()
      const window = source.schedules.find((s) => s.professional_id === business.professional_id && s.day === weekday)
      if (window) found.push(zonedToUtc(date, window.start, business.tz).getTime() + business.buffer_before * minute)
    }
    return found
  }

  const userRows: string[] = []
  const customerRows: string[] = []
  const appointmentRows: string[] = []
  const eventRows: string[] = []
  const reviewRows: string[] = []

  const addAppointment = (
    business: ReviewSource['businesses'][number],
    startsAt: number,
    customerId: string,
    customerUserId: string | null,
    review: (typeof DEMO_REVIEWS)[number] | null,
    reviewerName: string | null,
  ) => {
    const endsAt = startsAt + business.duration * minute
    const blockedStart = startsAt - business.buffer_before * minute
    const blockedEnd = endsAt + business.buffer_after * minute
    const id = uuidV7(random, startsAt - 3 * 86_400_000)
    const requestedAt = startsAt - 2 * 86_400_000
    const confirmedAt = requestedAt + 30 * minute
    const sensitive = business.category === 'Saude'

    appointmentRows.push(
      `(${uuid(id)}, ${uuid(business.id)}, ${uuid(business.professional_id)}, ${uuid(business.service_id)}, ${uuid(customerId)}, NULL, NULL, ` +
        `${iso(startsAt)}, ${iso(endsAt)}, ${iso(blockedStart)}, ${iso(blockedEnd)}, ${sqlText(business.service_name)}, ` +
        `${business.duration}, ${business.buffer_before}, ${business.buffer_after}, ${business.price}, ${sensitive}, 'Completed', ` +
        `'Online', ${sqlText(REVIEW_MARKER)}, NULL, ${iso(requestedAt)}, ${iso(confirmedAt)}, NULL, ${iso(endsAt)}, NULL, NULL, NULL, NULL, ${iso(requestedAt)})`,
    )
    const event = (from: string | null, to: string, actor: string | null, role: string, at: number) =>
      eventRows.push(
        `(${uuid(uuidV7(random, at))}, ${uuid(business.id)}, ${uuid(id)}, ${from ? sqlText(from) : 'NULL::text'}, ${sqlText(to)}, ` +
          `${actor ? uuid(actor) : 'NULL::uuid'}, ${sqlText(role)}, ${iso(at)}, NULL::text)`,
      )
    event(null, 'Pending', customerUserId, 'Customer', requestedAt)
    event('Pending', 'Confirmed', null, 'Owner', confirmedAt)
    event('Confirmed', 'Completed', null, 'Owner', endsAt)

    if (review && reviewerName) {
      const reviewedAt = Math.min(now - minute, endsAt + 2 * 60 * minute)
      reviewRows.push(
        `(${uuid(uuidV7(random, reviewedAt))}, ${uuid(business.id)}, ${uuid(id)}, ${uuid(business.professional_id)}, ${uuid(customerId)}, ` +
          `${review.rating}, ${review.professionalRating ?? 'NULL::int'}, ${review.comment ? sqlText(review.comment) : 'NULL::text'}, ` +
          `${sqlText(reviewerName)}, ${sensitive ? 'NULL::text' : sqlText(business.service_name)}, ${sensitive}, ${iso(reviewedAt)}, NULL::timestamptz, ` +
          `false, NULL::uuid, NULL::timestamptz, NULL::text, ${iso(reviewedAt)}, NULL::timestamptz)`,
      )
    }
  }

  // 1. O atendimento concluído sem avaliação, do consumidor de demonstração, no 1º estabelecimento (o mais recente).
  const days = orderedBusinesses.map(workdays)
  const unreviewed = days[0]!.shift()
  if (unreviewed !== undefined) addAppointment(orderedBusinesses[0]!, unreviewed, source.demo_customer_id, null, null, null)

  // 2. Uma avaliação por atendimento, de consumidores fictícios (mesma senha de teste: o hash é copiado).
  let reviewer = 0
  for (const review of DEMO_REVIEWS) {
    const startsAt = days[review.business]!.shift()
    if (startsAt === undefined) continue

    reviewer++
    const fullName = `${pick(random, FIRST_NAMES)} ${pick(random, SURNAMES)}`
    const userId = uuidV7(random, now - 40 * 86_400_000 + reviewer * 1000)
    const customerId = uuidV7(random, now - 40 * 86_400_000 + reviewer * 1000 + 1)
    userRows.push(`(${uuid(userId)}, ${sqlText(`consumidor.aval.${String(reviewer).padStart(2, '0')}@example.com`)}, ${sqlText(source.demo_customer_hash)}, ${sqlText(fullName)}, 'Active', now())`)
    customerRows.push(`(${uuid(customerId)}, ${uuid(userId)}, '1990-01-15', now())`)
    addAppointment(orderedBusinesses[review.business]!, startsAt, customerId, userId, review, publicName(fullName))
  }

  const lines: string[] = []
  if (userRows.length > 0) {
    lines.push(`INSERT INTO identity."user" (id, email, password_hash, full_name, status, created_at) VALUES\n${userRows.join(',\n')};`)
    lines.push(`INSERT INTO people.customer (id, user_id, birth_date, created_at) VALUES\n${customerRows.join(',\n')};`)
  }

  const appointmentColumns =
    'id, business_id, professional_id, service_id, customer_id, walk_in_name, walk_in_phone, starts_at, ends_at, ' +
    'blocked_starts_at, blocked_ends_at, service_name_snapshot, duration_minutes, buffer_before_minutes, buffer_after_minutes, ' +
    'price_cents, is_sensitive, status, source, customer_notes, business_notes, requested_at, confirmed_at, cancelled_at, ' +
    'completed_at, cancelled_by, cancellation_reason, expires_at, idempotency_key, created_at'
  // `ON CONFLICT DO NOTHING` cobre também a constraint de exclusão: se o horário já estiver ocupado, o atendimento é
  // pulado, e eventos e avaliações abaixo só entram para os atendimentos que de fato existem.
  lines.push(`INSERT INTO scheduling.appointment (${appointmentColumns}) VALUES\n${appointmentRows.join(',\n')}\nON CONFLICT DO NOTHING;`)

  const exists = `EXISTS (SELECT 1 FROM scheduling.appointment a WHERE a.id = v.appointment_id AND a.customer_notes = ${sqlText(REVIEW_MARKER)})`
  lines.push(`
    INSERT INTO scheduling.appointment_event (id, business_id, appointment_id, from_status, to_status, actor_user_id, actor_role, occurred_at, note)
    SELECT v.id, v.business_id, v.appointment_id, v.from_status, v.to_status, v.actor_user_id, v.actor_role, v.occurred_at, v.note
    FROM (VALUES\n${eventRows.join(',\n')}) AS v(id, business_id, appointment_id, from_status, to_status, actor_user_id, actor_role, occurred_at, note)
    WHERE ${exists};`)
  lines.push(`
    INSERT INTO reputation.review (id, business_id, appointment_id, professional_id, customer_id, rating, professional_rating, comment,
        reviewer_name, service_name, is_sensitive, reviewed_at, edited_at, is_hidden, hidden_by_user_id, hidden_at, hidden_reason, created_at, updated_at)
    SELECT v.id, v.business_id, v.appointment_id, v.professional_id, v.customer_id, v.rating, v.professional_rating, v.comment,
        v.reviewer_name, v.service_name, v.is_sensitive, v.reviewed_at, v.edited_at, v.is_hidden, v.hidden_by_user_id, v.hidden_at, v.hidden_reason, v.created_at, v.updated_at
    FROM (VALUES\n${reviewRows.join(',\n')}) AS v(id, business_id, appointment_id, professional_id, customer_id, rating, professional_rating, comment,
        reviewer_name, service_name, is_sensitive, reviewed_at, edited_at, is_hidden, hidden_by_user_id, hidden_at, hidden_reason, created_at, updated_at)
    WHERE ${exists};`)

  // Os resumos saem das avaliações que de fato entraram (a média e a contagem do produto são atualizadas pela API; aqui
  // o SQL faz o mesmo cálculo uma vez).
  const stars = [1, 2, 3, 4, 5].map((n) => `count(*) FILTER (WHERE ${'{col}'} = ${n})`)
  const summary = (target: 'Business' | 'Professional', targetColumn: string, ratingColumn: string, where: string) => `
    INSERT INTO reputation.rating_summary (id, business_id, target, target_id, count, sum, stars1, stars2, stars3, stars4, stars5, created_at)
    SELECT gen_random_uuid(), r.business_id, '${target}', r.${targetColumn}, count(*), sum(r.${ratingColumn}),
        ${stars.map((s) => s.replaceAll('{col}', `r.${ratingColumn}`)).join(', ')}, now()
    FROM reputation.review r
    WHERE r.appointment_id IN (SELECT id FROM scheduling.appointment WHERE customer_notes = ${sqlText(REVIEW_MARKER)}) ${where}
    GROUP BY r.business_id, r.${targetColumn};`
  lines.push(summary('Business', 'business_id', 'rating', ''))
  lines.push(summary('Professional', 'professional_id', 'professional_rating', 'AND r.professional_rating IS NOT NULL'))

  // Uma transação só (-1): ou tudo entra, ou nada entra.
  psql(lines.join('\n'))
  const counts = psql(`
    SELECT count(*) FROM scheduling.appointment WHERE customer_notes = ${sqlText(REVIEW_MARKER)}
    UNION ALL SELECT count(*) FROM reputation.review WHERE appointment_id IN (SELECT id FROM scheduling.appointment WHERE customer_notes = ${sqlText(REVIEW_MARKER)});
  `).split('\n')
  console.log(`  ${counts[0]} atendimentos concluídos, ${counts[1]} avaliações (1 atendimento fica sem avaliação, do ${CUSTOMER.email})`)
}

// --- Fotos, folgas e consentimento (pela API, idempotentes) --------------------------------------------

type SeedImageFile = ReturnType<typeof imageFor>

/** O mesmo envio da interface: `PUT` multipart, campo `file`. Imagem quadrada, como a que sai do recorte. */
async function uploadImage(path: string, image: SeedImageFile, token: string) {
  const form = new FormData()
  form.append('file', new File([image.bytes as BlobPart], image.fileName, { type: image.contentType }))
  const response = await fetch(`${API}${path}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: form })
  if (!response.ok) throw new ApiCallError(response.status, undefined, `PUT ${path} → ${response.status} ${await response.text()}`)
}

/** O tipo do estabelecimento ("barbearia", "salao"…), pela especialidade do primeiro profissional. */
function kindOf(demo: DemoBusiness): KindKey | undefined {
  return (Object.keys(KINDS) as KindKey[]).find((key) => KINDS[key].specialty === demo.professionals[0]?.specialty)
}

/**
 * Fotos 2 e 3 da vitrine (a primeira é a capa), das imagens que o Arthur põe em `scripts/seed-assets/vitrine/<tipo>-<n>.*`
 * (`LISTA-DE-ARQUIVOS.md`). Só entra se o estabelecimento já tem capa (a vitrine não tem buraco: a foto 2 sem a 1 viraria
 * a capa) e só o que falta. Sem arquivo, nada é gerado: o estabelecimento fica com as fotos que tiver. Devolve quantas enviou.
 */
async function seedGalleryExtras(demo: DemoBusiness, token: string): Promise<number> {
  const kind = kindOf(demo)
  if (!kind) return 0

  let { photos = [] } = await call<{ photos?: unknown[] }>('GET', '/api/businesses/current', undefined, token)
  if (photos.length === 0) return 0

  // A ordem das fotos 2 e 3 gira de um estabelecimento para outro, para a vitrine não ser igual em todos do mesmo tipo.
  const turn = [...demo.name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 2
  let sent = 0
  for (const number of turn === 0 ? [2, 3] : [3, 2]) {
    if (photos.length >= 3) break
    const file = fileFor('vitrine', `${kind}-${number}`)
    if (!file) continue
    await uploadImage(`/api/businesses/current/photos/${photos.length}`, file, token)
    photos = [...photos, null]
    sent++
  }
  return sent
}

/** Entra como o dono e devolve o token com o estabelecimento ativo. `null` se ele não tem estabelecimento. */
async function ownerSession(demo: DemoBusiness): Promise<{ token: string; businessId: string } | null> {
  const userToken = await login(demo.owner.email)
  const me = await call<{ businesses: { businessId: string; name: string }[] }>('GET', '/api/users/me', undefined, userToken)
  const businessId = (me.businesses.find((b) => b.name === demo.name) ?? me.businesses[0])?.businessId
  if (!businessId) return null
  const { accessToken } = await call<{ accessToken: string }>('POST', '/api/users/me/context', { businessId }, userToken)
  return { token: accessToken, businessId }
}

type ServiceItem = {
  id: string
  name: string
  description: string | null
  durationMinutes: number
  bufferBeforeMinutes: number
  bufferAfterMinutes: number
  slotStepMinutes: number
  priceCents: number
  suppliesNote: string | null
  isActive: boolean
  photo: unknown | null
  showPhotoInShowcase: boolean
}

/**
 * Logotipo, capa, fotos de serviços e de profissionais, "mostrar foto na vitrine" e folgas. Só envia o que falta:
 * rodar de novo não duplica nem gasta o limite de 20 envios por hora de cada dono.
 */
async function seedExtras(demo: DemoBusiness, index: number) {
  const session = await ownerSession(demo)
  if (!session) return
  const { token } = session
  let uploads = 0
  let changes = 0

  const business = await call<{ status: string; logo: unknown | null; cover: unknown | null }>('GET', '/api/businesses/current', undefined, token)
  if (business.status !== 'Active') return
  if (!business.logo) {
    await uploadImage('/api/businesses/current/logo', imageFor('logo', demo.name), token)
    uploads++
  }
  if (hasCover(index) && !business.cover) {
    // Capa: o arquivo do estabelecimento (`cover/`), senão a foto 1 do tipo (`vitrine/<tipo>-1`), senão a imagem gerada.
    const kind = kindOf(demo)
    const cover = fileFor('cover', demo.name) ?? (kind ? fileFor('vitrine', `${kind}-1`) : null) ?? imageFor('cover', demo.name)
    await uploadImage('/api/businesses/current/cover', cover, token)
    uploads++
  }
  uploads += await seedGalleryExtras(demo, token)

  const services = await call<{ items: ServiceItem[] }>('GET', '/api/businesses/current/services?pageSize=50', undefined, token)
  for (const service of services.items) {
    const s = demo.services.findIndex((candidate) => candidate.name === service.name)
    if (s < 0 || !serviceHasPhoto(index, s)) continue

    if (!service.photo) {
      await uploadImage(`/api/businesses/current/services/${service.id}/image`, imageFor('service', service.name, `${demo.name}|${service.name}`), token)
      uploads++
    }
    const showcase = serviceShowsPhotoInShowcase(index, s)
    if (service.showPhotoInShowcase !== showcase) {
      await call(
        'PUT',
        `/api/businesses/current/services/${service.id}`,
        {
          name: service.name,
          description: service.description,
          durationMinutes: service.durationMinutes,
          bufferBeforeMinutes: service.bufferBeforeMinutes,
          bufferAfterMinutes: service.bufferAfterMinutes,
          slotStepMinutes: service.slotStepMinutes,
          priceCents: service.priceCents,
          suppliesNote: service.suppliesNote,
          isActive: service.isActive,
          showPhotoInShowcase: showcase,
        },
        token,
      )
      changes++
    }
  }

  const team = await call<{ items: { id: string; displayName: string; photo: unknown | null }[] }>(
    'GET',
    '/api/businesses/current/professionals?pageSize=50',
    undefined,
    token,
  )
  for (const professional of team.items) {
    const p = demo.professionals.findIndex((candidate) => candidate.displayName === professional.displayName)
    if (p < 0 || professional.photo || !professionalHasPhoto(index, p)) continue
    await uploadImage(
      `/api/businesses/current/professionals/${professional.id}/photo`,
      imageFor('professional', professional.displayName, `${demo.name}|${professional.displayName}`),
      token,
    )
    uploads++
  }

  const plan = timeOffPlan(index, demo.professionals.length)
  if (plan.length > 0) {
    const existing = await call<{ items: { professionalId: string | null; reason: string | null }[] }>(
      'GET',
      '/api/businesses/current/schedule-exceptions?pageSize=100',
      undefined,
      token,
    )
    for (const item of plan) {
      const professional = team.items.find((candidate) => candidate.displayName === demo.professionals[item.professionalIndex]?.displayName)
      if (!professional) continue
      if (existing.items.some((e) => e.professionalId === professional.id && e.reason === TIME_OFF_REASON)) continue
      await call(
        'POST',
        '/api/businesses/current/schedule-exceptions',
        {
          professionalId: professional.id,
          kind: item.kind,
          startsAt: zonedToUtc(addDays(today, item.startOffsetDays), '00:00:00', TIME_ZONE).toISOString(),
          endsAt: zonedToUtc(addDays(today, item.endOffsetDays), '00:00:00', TIME_ZONE).toISOString(),
          reason: TIME_OFF_REASON,
          existingAppointments: 'Keep',
        },
        token,
      )
      changes++
    }
  }

  if (uploads + changes > 0) console.log(`  ${demo.name}: ${uploads} imagens, ${changes} ajustes (vitrine e folgas)`)
}

/**
 * Em Saúde o próprio agendamento é dado sensível (LGPD Art. 11): o consumidor de demonstração concede o consentimento
 * específico, na versão vigente, e marca uma consulta no primeiro estabelecimento de Saúde. Sem o consentimento a API
 * recusa o pedido (`compliance.consent_required`). A chave de idempotência fixa impede um segundo agendamento.
 */
async function seedHealthConsent() {
  const demo = BUSINESSES.find((candidate) => candidate.category === 'Saude')
  if (!demo) return
  console.log(`• Consentimento de Saúde e consulta em ${demo.name}`)

  const token = await login(CUSTOMER.email)
  const versions = await call<{ sensitiveScheduling: string }>('GET', '/api/consents/versions')
  const mine = await call<{ items: { purpose: string; version: string; revokedAt: string | null }[] }>('GET', '/api/consents?pageSize=100', undefined, token)
  const granted = mine.items.some(
    (consent) => consent.purpose === 'SensitiveScheduling' && consent.version === versions.sensitiveScheduling && !consent.revokedAt,
  )
  if (!granted) await call('POST', '/api/consents', { purpose: 'SensitiveScheduling', version: versions.sensitiveScheduling }, token)

  const session = await ownerSession(demo)
  if (!session) return
  const { businessId } = session
  const services = await call<{ items: { id: string; professionals: { professionalId: string }[] }[] }>('GET', `/api/businesses/${businessId}/services?pageSize=50`)
  const offer = services.items.flatMap((service) => service.professionals.map(({ professionalId }) => ({ serviceId: service.id, professionalId })))[0]
  if (!offer) return

  for (let offset = 2; offset <= 9; offset++) {
    const { slots } = await call<Slots>(
      'GET',
      `/api/businesses/${businessId}/availability?serviceId=${offer.serviceId}&professionalId=${offer.professionalId}&date=${daysFromToday(offset)}`,
    )
    const startsAt = slots[0]
    if (!startsAt) continue
    try {
      await call(
        'POST',
        '/api/appointments',
        { businessId, ...offer, startsAt, notes: null, attendeeName: null, idempotencyKey: `seed-saude-${businessId}` },
        token,
      )
      console.log(`  consentimento concedido; consulta pedida para ${startsAt}`)
    } catch (error) {
      if (!(error instanceof ApiCallError)) throw error
      console.log(`  consentimento concedido; a consulta não foi criada (${error.code ?? error.status})`)
    }
    return
  }
}

/**
 * A API responde? Direto, a saúde mora em `/health`; pelo web (ambiente final, `API_URL=http://127.0.0.1:8090`, sem
 * porta da API no host), em `/api/health`. O nginx devolve o `index.html` (HTML) para o que não conhece, então uma
 * resposta HTML não prova nada.
 */
async function ensureApiIsUp() {
  for (const path of ['/health', '/api/health']) {
    try {
      const response = await fetch(`${API}${path}`)
      if (response.ok && !(response.headers.get('content-type') ?? '').includes('html')) return
    } catch {
      // Tenta o outro caminho.
    }
  }
  throw new Error(`A API não respondeu em ${API}. Rode "docker compose up" antes.`)
}

async function main() {
  console.log(`Populando ${API} com dados de demonstração${WITH_HISTORY ? ' (com histórico)' : ''}\n`)
  await ensureApiIsUp()
  refuseDefaultPasswordOutsideDevelopment()

  for (const business of BUSINESSES) {
    await seedBusiness(business)
  }
  await seedBusiness(PENDING_REVIEW_DEMO)
  await seedDuartinaTeam()
  await seedCustomer()
  const adminCreated = await approvePendingBusinesses()

  // Só com os estabelecimentos aprovados: fotos, vitrine e folgas (o passado, que não passa pela API, vem depois).
  console.log('• Fotos, vitrine e folgas')
  for (const [index, business] of BUSINESSES.entries()) {
    await seedExtras(business, index)
  }
  await seedHealthConsent()

  // O histórico já traz hoje e os próximos 14 dias; sem ele, uma agenda pequena para o painel não abrir vazio.
  if (WITH_HISTORY) seedHistory()
  else await seedTodayAgenda()
  // Depois do histórico e da agenda: as avaliações cedem a qualquer agendamento que já ocupe o horário.
  seedReviews()
  printCounts()

  // A senha só aparece quando é a padrão (já pública) ou a aleatória do Admin, recém-criada; a de SEED_* é de quem
  // a definiu e não vai para o log.
  const demoPassword = DEMO_PASSWORD === DEFAULT_PASSWORD ? DEMO_PASSWORD : 'a de SEED_PASSWORD'
  console.log(`\nPronto. Contas de demonstração (senha: ${demoPassword}):`)
  console.log(`  consumidor   ${CUSTOMER.email}`)
  console.log(`  donos        dono.<estabelecimento>@example.com — ${BUSINESSES.length} estabelecimentos, por exemplo ${BUSINESSES[0]!.owner.email}`)
  console.log(`  em análise   ${PENDING_REVIEW_DEMO.owner.email} — ${PENDING_REVIEW_DEMO.name} (Saúde), para o Admin aprovar`)
  console.log(`  profissional ${TEAM.professional.email} — com conta, ligado ao perfil ${DUARTINA.professionalProfile}`)
  console.log(`  atendente    ${TEAM.attendant.email} — opera a agenda de todos`)
  console.log(`  convite      ${TEAM.invited.email} — pendente (e-mail no Mailpit)`)
  console.log(`  convite      ${TEAM.invitedProfessional.email} — profissional, especialidade ${TEAM.invitedProfessional.specialty} (e-mail no Mailpit)`)
  if (ADMIN_PASSWORD_FROM_ENV) console.log(`  admin        ${ADMIN.email} (senha: a de SEED_ADMIN_PASSWORD)`)
  else if (adminCreated) console.log(`  admin        ${ADMIN.email} (senha gerada agora, anote — não aparece de novo: ${ADMIN_PASSWORD})`)
  else console.log(`  admin        ${ADMIN.email} (já existia; senha inalterada)`)
}

main().catch((error) => {
  console.error(`\n✖ ${error instanceof Error ? error.message : error}`)
  process.exit(1)
})
