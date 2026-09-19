import { Card, CardDescription, CardHeader, CardTitle } from '../ui/card'

import { CardEstablishmentImage } from './components/CardEstablishmentImage'

export const CardEstablishment = () => {
  return (
    <Card className="max-h-56 rounded-lg" size="sm">
      <CardHeader>
        <CardEstablishmentImage className="w-full max-h-36 rounded-lg" />
        <CardTitle>Studio Bela Vista</CardTitle>
        <CardDescription>Studio x</CardDescription>
      </CardHeader>
    </Card>
  )
}
