import type { MyAccountData, MyAccountScreenProps } from '@pages/account/screen/types'

export type AttendantProfileScreenProps = {
  data: MyAccountData
  businessName: string
  onSaveName: MyAccountScreenProps['onSaveName']
  onChangePassword: MyAccountScreenProps['onChangePassword']
  onSignOut: () => void
}
