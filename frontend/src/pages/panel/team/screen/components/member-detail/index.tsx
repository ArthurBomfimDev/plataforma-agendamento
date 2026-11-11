import { OVERLINE, publicBasisLabel, roleLabel, servicesLabel, workLabel } from '../../consts'

import { Avatar } from '@components/avatar'
import { Button } from '@components/button'
import { ChevronLeftIcon, LockIcon } from '@assets/icons'
import type { MemberDetailProps } from './types'
import { MemberPhoto } from '../member-photo'
import { SettingRow } from '../setting-row'
import { initials } from '@pages/panel/agenda/screen/consts'
import { mediaUrl } from '@api/services/media'

const CARD = 'rounded-(--radius-md) border border-(--border-subtle) bg-(--bg-surface)'

/**
 * O profissional selecionado (Figma 17, coluna da direita): identidade, perfil público e o que só o
 * proprietário controla. As mudanças abrem a gaveta de edição que já existia; aqui só se mostra o estado.
 *
 * O perfil é sempre público enquanto o profissional está ativo (ADR-031); a ficha mostra a base: a declaração do dono
 * ou o próprio profissional.
 */
export const MemberDetail = (props: MemberDetailProps) => {
  const { member, services, busy, photo, onBack, onEdit, onOpenSchedules } = props
  const { onDeactivate, onActivate } = props

  return (
    <div className="flex min-w-0 flex-col gap-(--space-12)">
      <Button variant="ghost" className="-ml-(--space-8) self-start lg:hidden" onClick={onBack}>
        <ChevronLeftIcon aria-hidden="true" className="size-5" />
        Equipe
      </Button>

      <section
        aria-label={member.displayName}
        className={`${CARD} flex flex-wrap items-center gap-3.5 px-4.5 py-3.5`}
      >
        <Avatar
          alt=""
          src={member.photo ? mediaUrl(member.photo.small) : undefined}
          initials={initials(member.displayName)}
          size="lg"
        />
        <div className="flex min-w-0 flex-1 basis-48 flex-col gap-(--space-2)">
          <h2 className="type-body-lg text-(--text-strong)">{member.displayName}</h2>
          <p className="type-caption text-(--text-muted)">
            Nome de exibição · sempre visível para quem agenda
          </p>
        </div>
        <Button variant="secondary" onClick={onEdit}>
          Editar nome
        </Button>
      </section>

      <h3 className={OVERLINE}>Perfil público</h3>
      <section className={`${CARD} flex flex-col gap-2.5 px-4.5 pt-1 pb-3.5`}>
        <SettingRow
          label="Perfil público"
          value="Nome, especialidade, apresentação e foto na página do estabelecimento"
          trailing={member.isActive ? 'Visível' : 'Oculto'}
        />
        {photo && (
          <div className="max-w-60">
            <MemberPhoto place="detail" member={member} {...photo} />
          </div>
        )}
        <div className="flex flex-col gap-1.5 rounded-(--radius-sm) bg-(--marker-sensitive-bg) px-3.5 py-3">
          <p className="type-caption flex flex-wrap items-center gap-(--space-8) text-(--marker-sensitive-fg)">
            <span className="inline-flex items-center gap-(--space-4) px-(--space-8) py-(--space-2)">
              <LockIcon aria-hidden="true" className="size-4" />
              Dado pessoal
            </span>
            {publicBasisLabel(member)}
          </p>
          <p className="type-caption text-(--text-muted)">
            Todo profissional ativo aparece na vitrine. Para quem não tem login, a base é a sua
            declaração de que tem a autorização da pessoa; quem tem login controla a própria
            apresentação e foto e pode sair da equipe quando quiser. Desativar tira o perfil da
            vitrine na hora.
          </p>
        </div>
      </section>

      <h3 className={OVERLINE}>O que o proprietário controla</h3>
      <section className={`${CARD} flex flex-col divide-y divide-(--border-subtle) px-4.5`}>
        <SettingRow
          label="Jornada e bloqueios"
          value={workLabel(member)}
          onClick={onOpenSchedules}
        />
        <SettingRow
          label="Serviços que executa"
          value={servicesLabel(member, services)}
          onClick={onEdit}
        />
        <SettingRow label="Papel no estabelecimento" value={roleLabel(member)} />
      </section>

      <div className="flex flex-wrap items-center gap-(--space-12)">
        {member.isActive ? (
          <Button
            variant="secondary"
            className="border-(--status-rejected-fg) text-(--status-rejected-fg) hover:text-(--status-rejected-fg)"
            disabled={busy}
            onClick={onDeactivate}
          >
            {busy ? 'Salvando…' : 'Remover da equipe'}
          </Button>
        ) : (
          <Button variant="secondary" disabled={busy} onClick={onActivate}>
            {busy ? 'Salvando…' : 'Voltar para a equipe'}
          </Button>
        )}
        <p className="type-caption min-w-0 flex-1 basis-60 text-(--text-muted)">
          {member.isActive
            ? 'Remover não apaga o histórico: os atendimentos já feitos continuam nos relatórios.'
            : 'Fora da equipe, não aparece na agenda nem na vitrine. O histórico continua nos relatórios.'}
        </p>
      </div>
    </div>
  )
}
