import type { TextFieldProps } from '@components/text-field/types'

/** Os mesmos campos do `TextField`, menos o `type`: quem decide se a senha aparece é o botão. */
export type PasswordFieldProps = Omit<TextFieldProps, 'type'>
