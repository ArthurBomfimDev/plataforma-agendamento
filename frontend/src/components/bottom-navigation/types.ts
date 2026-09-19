export type NavigationItemId = 'search' | 'appointments' | 'profile'

export type BottomNavigationProps = {
  activeItem: NavigationItemId
  onNavigate?: (item: NavigationItemId) => void
}
