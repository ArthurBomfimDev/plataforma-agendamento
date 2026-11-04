import type { BusinessCategoryName, PostalCodeResponse, ProfessionalCouncilName } from '@api/models'

export type WizardStep = 'business' | 'document' | 'address' | 'responsible' | 'review'

/** Cada função devolve `null` se deu certo, senão a mensagem de erro já em português. */
export type StepResult = Promise<string | null>

export type BusinessValues = { name: string; category: BusinessCategoryName }

export type AddressValues = {
  postalCode: string
  street: string
  streetNumber: string
  district: string
  city: string
  state: string
}

export type ResponsibleValues = {
  name: string
  council: ProfessionalCouncilName
  councilNumber: string
  councilState: string
}

export type RegisterScreenProps = {
  /** Onde o assistente começa. Quem já criou o estabelecimento (rascunho) volta direto ao endereço. */
  initialStep?: WizardStep
  /** Categoria do estabelecimento já criado; define se há o passo do responsável. */
  createdCategory?: BusinessCategoryName
  /** Endereço já salvo, para retomar sem digitar de novo. */
  savedAddress?: Partial<AddressValues>
  /** Cria o estabelecimento (nome, categoria e documento) e passa o contexto para ele. */
  onCreate: (business: BusinessValues, document: string) => StepResult
  /** Salva o endereço e confirma a localização. */
  onSaveAddress: (address: AddressValues) => StepResult
  onSaveResponsible: (responsible: ResponsibleValues) => StepResult
  /** Aceita os termos e segue para o painel, com o estabelecimento em rascunho. */
  onFinish: () => StepResult
  /** Consulta o CEP; `null` se não achou. */
  onLookupPostalCode: (postalCode: string) => Promise<PostalCodeResponse | null>
  /** Sai do assistente sem terminar (o que foi salvo fica no rascunho). */
  onLeave: () => void
}
