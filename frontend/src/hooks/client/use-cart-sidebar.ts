import { usePathname } from 'next/navigation'
import useDeviceType from './use-device-type'
import useCartStore from '../stores/use-cart-store'

const isNotInPaths = (s: string) => {
  return !new RegExp(
    `^(?:/(?:en|fr|es|de))?(?:/$|/cart$|/checkout$|/sign-in$|/sign-up$|/order(?:/.*)?$|/account(?:/.*)?$|/admin(?:/.*)?$)?$`
  ).test(s)
}

function useCartSidebar() {
  const { cart } = useCartStore()   // <-- get cart object
  const { items } = cart            // <-- extract items from cart
  const deviceType = useDeviceType()
  const currentPath = usePathname()

  return items.length > 0 && deviceType === 'desktop' && isNotInPaths(currentPath)
}

export default useCartSidebar
