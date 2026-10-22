/**
 * Popula o ambiente local com dados de DEMONSTRAÇÃO — estabelecimentos fictícios, não dado real.
 *
 * Usa a própria API para tudo (cadastro, estabelecimento, profissionais, serviços, jornada), então
 * passa pelas mesmas regras que o app. A única exceção é a aprovação do estabelecimento, que é papel
 * do Admin e ainda não tem endpoint: é feita por SQL direto no container do banco.
 *
 * Uso (com `docker compose up` rodando):   bun scripts/seed-demo.ts
 * Idempotente: se as contas de demonstração já existem, não cria nada de novo.
 *
 * As senhas abaixo são credenciais de TESTE do ambiente local, sem valor fora dele.
 */

const API = process.env.API_URL ?? 'http://localhost:8081'
const DEMO_PASSWORD = process.env.SEED_PASSWORD ?? 'demo-12345678'
const TIME_ZONE = 'America/Sao_Paulo'

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
    if (response.status === 429 && attempt < 6) {
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

type DemoService = { name: string; description: string; durationMinutes: number; priceCents: number }
type DemoProfessional = { displayName: string; specialty: string; bio: string; isMe: boolean }
type DemoBusiness = {
  owner: { fullName: string; email: string }
  name: string
  cnpjRoot: string
  address: { street: string; streetNumber: string; district: string; city: string; state: string; postalCode: string }
  location: { latitude: number; longitude: number }
  professionals: DemoProfessional[]
  services: DemoService[]
}

// Garça-SP, perto da FATEC — a demonstração do TCC é feita lá.
const BUSINESSES: DemoBusiness[] = [
  {
    owner: { fullName: 'Duartina Souza', email: 'dono.duartina@exemplo.com' },
    name: 'Estúdio Duartina',
    cnpjRoot: '112223330001',
    address: { street: 'Rua Carlos Ferrari', streetNumber: '100', district: 'Centro', city: 'Garça', state: 'SP', postalCode: '17400000' },
    location: { latitude: -22.2125, longitude: -49.6564 },
    professionals: [
      { displayName: 'Duartina Souza', specialty: 'Cabeleireira', bio: 'Cortes e coloração há 12 anos.', isMe: true },
      { displayName: 'Marcos Lima', specialty: 'Barbeiro', bio: 'Especialista em barba e degradê.', isMe: false },
    ],
    services: [
      { name: 'Corte masculino', description: 'Corte na tesoura ou máquina, com finalização.', durationMinutes: 30, priceCents: 4500 },
      { name: 'Corte + barba', description: 'Corte completo e barba com toalha quente.', durationMinutes: 60, priceCents: 8000 },
      { name: 'Barba', description: 'Barba modelada com navalha.', durationMinutes: 20, priceCents: 3000 },
    ],
  },
  {
    owner: { fullName: 'Helena Prado', email: 'dono.helena@exemplo.com' },
    name: 'Espaço Helena Unhas',
    cnpjRoot: '445556660001',
    address: { street: 'Avenida Rafael Paes de Barros', streetNumber: '520', district: 'Jardim Paulista', city: 'Garça', state: 'SP', postalCode: '17400000' },
    location: { latitude: -22.2068, longitude: -49.6611 },
    professionals: [{ displayName: 'Helena Prado', specialty: 'Manicure', bio: 'Unhas em gel e esmaltação.', isMe: true }],
    services: [
      { name: 'Manicure', description: 'Cutilagem e esmaltação.', durationMinutes: 45, priceCents: 3500 },
      { name: 'Pé e mão', description: 'Manicure e pedicure.', durationMinutes: 90, priceCents: 6000 },
    ],
  },
  {
    owner: { fullName: 'Rogério Antunes', email: 'dono.rogerio@exemplo.com' },
    name: 'Barbearia do Rogério',
    cnpjRoot: '778889990001',
    address: { street: 'Rua Barão do Rio Branco', streetNumber: '45', district: 'Vila Willi', city: 'Garça', state: 'SP', postalCode: '17400000' },
    location: { latitude: -22.2167, longitude: -49.6502 },
    professionals: [
      { displayName: 'Rogério Antunes', specialty: 'Barbeiro', bio: 'Barbearia clássica desde 2010.', isMe: true },
      { displayName: 'Tiago Melo', specialty: 'Barbeiro', bio: 'Cortes modernos e pigmentação.', isMe: false },
    ],
    services: [
      { name: 'Corte masculino', description: 'Corte e lavagem.', durationMinutes: 40, priceCents: 4000 },
      { name: 'Barba', description: 'Barba completa.', durationMinutes: 30, priceCents: 3500 },
    ],
  },
]

const CUSTOMER = { fullName: 'Ana Consumidora', email: 'consumidor@exemplo.com', birthDate: '1995-05-10' }

/** Seg a sex 09:00–18:00, sáb 09:00–13:00. `DayOfWeek` do .NET: 0 = domingo. */
const WEEK: { day: number; start: string; end: string }[] = [
  ...[1, 2, 3, 4, 5].map((day) => ({ day, start: '09:00:00', end: '18:00:00' })),
  { day: 6, start: '09:00:00', end: '13:00:00' },
]

const today = new Date().toISOString().slice(0, 10)

/** Cadastra e entra. `null` se a conta já existia — o seed já rodou. */
async function registerAndLogin(fullName: string, email: string): Promise<string | null> {
  try {
    await call('POST', '/api/auth/register', { email, password: DEMO_PASSWORD, fullName })
  } catch (error) {
    if (error instanceof ApiCallError && error.code === 'user.email_already_registered') return null
    throw error
  }
  const auth = await call<{ accessToken: string }>('POST', '/api/auth/login', { email, password: DEMO_PASSWORD })
  return auth.accessToken
}

async function seedBusiness(demo: DemoBusiness) {
  console.log(`• ${demo.name}`)
  const userToken = await registerAndLogin(demo.owner.fullName, demo.owner.email)
  if (!userToken) {
    console.log('  já existe — pulando')
    return
  }

  const business = await call<{ id: string }>(
    'POST',
    '/api/businesses',
    { name: demo.name, document: cnpjFrom(demo.cnpjRoot), category: 'Beleza' },
    userToken,
  )

  // O token precisa carregar o estabelecimento ativo para as rotas `businesses/current` (ADR-004).
  const { accessToken: token } = await call<{ accessToken: string }>(
    'POST',
    '/api/users/me/context',
    { businessId: business.id },
    userToken,
  )

  await call('PUT', '/api/businesses/current/address', demo.address, token)
  await call(
    'PUT',
    '/api/businesses/current/location',
    { ...demo.location, precision: 'Rooftop', source: 'seed-demo' },
    token,
  )
  await call(
    'PUT',
    '/api/businesses/current/scheduling-policy',
    {
      autoConfirm: false,
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
    const created = await call<{ id: string }>('POST', '/api/businesses/current/professionals', professional, token)
    professionalIds.push(created.id)

    // Sem consentimento, a vitrine mostra só o nome (ADR-004, invariante 4). Só o próprio
    // profissional consente — o dono não pode por outra pessoa —, então só vale para "sou eu".
    if (professional.isMe) {
      await call('PUT', `/api/businesses/current/professionals/${created.id}/public-profile-consent`, undefined, token)
      await call(
        'PUT',
        `/api/businesses/current/professionals/${created.id}`,
        { displayName: professional.displayName, specialty: professional.specialty, bio: professional.bio, isActive: true, showFullProfile: true },
        token,
      )
    }

    for (const { day, start, end } of WEEK) {
      await call(
        'POST',
        '/api/businesses/current/work-schedules',
        { professionalId: created.id, dayOfWeek: day, startTime: start, endTime: end, effectiveFrom: today, effectiveTo: null },
        token,
      )
    }
  }

  for (const service of demo.services) {
    const created = await call<{ id: string }>(
      'POST',
      '/api/businesses/current/services',
      {
        ...service,
        bufferBeforeMinutes: 0,
        bufferAfterMinutes: 0,
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

  await call('POST', '/api/businesses/current/submit', undefined, token)
  console.log('  criado e enviado para revisão')
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

/** Aprovação = papel do Admin, sem endpoint ainda. Só no banco local do Docker. */
function approvePendingBusinesses() {
  const sql = `UPDATE tenancy.business SET status = 'Active', verification_level = 'Verified' WHERE status = 'PendingReview';`
  const result = Bun.spawnSync(
    ['docker', 'compose', 'exec', '-T', 'db', 'sh', '-c', `psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "${sql}"`],
    { stdout: 'pipe', stderr: 'pipe' },
  )
  if (result.exitCode !== 0) {
    throw new Error(`Falha ao aprovar no banco: ${result.stderr.toString()}`)
  }
  console.log(`• Aprovação no banco: ${result.stdout.toString().trim()}`)
}

async function main() {
  console.log(`Populando ${API} com dados de demonstração\n`)
  await call('GET', '/health').catch(() => {
    throw new Error(`A API não respondeu em ${API}. Rode "docker compose up" antes.`)
  })

  for (const business of BUSINESSES) {
    await seedBusiness(business)
  }
  await seedCustomer()
  approvePendingBusinesses()

  console.log(`\nPronto. Contas de demonstração (senha: ${DEMO_PASSWORD}):`)
  console.log(`  consumidor   ${CUSTOMER.email}`)
  for (const { owner, name } of BUSINESSES) console.log(`  dono         ${owner.email}  (${name})`)
}

main().catch((error) => {
  console.error(`\n✖ ${error instanceof Error ? error.message : error}`)
  process.exit(1)
})
