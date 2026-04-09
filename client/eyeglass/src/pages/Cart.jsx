import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'
import {
  useGetCartQuery,
  useUpdateCartItemMutation,
  useRemoveFromCartMutation,
  useClearCartMutation,
  useCreateCheckoutSessionMutation,
  useConfirmPaymentSessionMutation,
} from '../redux/api/cart'
import './Cart.css'

const etbFormatter = new Intl.NumberFormat('en-ET', {
  style: 'currency',
  currency: 'ETB',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const getReadableError = (error, fallbackMessage) => {
  const rawMessage = error?.data?.message ?? error?.error ?? error?.message

  if (typeof rawMessage === 'string' && rawMessage.trim()) {
    return rawMessage
  }

  if (Array.isArray(rawMessage)) {
    return rawMessage.filter(Boolean).join(', ') || fallbackMessage
  }

  if (rawMessage && typeof rawMessage === 'object') {
    if (typeof rawMessage.message === 'string' && rawMessage.message.trim()) {
      return rawMessage.message
    }

    try {
      return JSON.stringify(rawMessage)
    } catch {
      return fallbackMessage
    }
  }

  return fallbackMessage
}

const Cart = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [guestCartItems, setGuestCartItems] = useState([])
  const [paymentInfo, setPaymentInfo] = useState('')
  const [paymentError, setPaymentError] = useState('')
  const token = localStorage.getItem('token')
  const {
    data: cart,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetCartQuery(undefined, {
    skip: !token,
    refetchOnMountOrArgChange: true,
  })
  const [updateCartItem, { isLoading: isUpdating }] = useUpdateCartItemMutation()
  const [removeFromCart, { isLoading: isRemoving }] = useRemoveFromCartMutation()
  const [clearCart, { isLoading: isClearing }] = useClearCartMutation()
  const [createCheckoutSession, { isLoading: isCheckingOut }] = useCreateCheckoutSessionMutation()
  const [confirmPaymentSession] = useConfirmPaymentSessionMutation()

  useEffect(() => {
    if (!token) {
      const savedCart = localStorage.getItem('cart')
      setGuestCartItems(savedCart ? JSON.parse(savedCart) : [])
    }
  }, [token])

  const syncGuestCart = (nextCart) => {
    setGuestCartItems(nextCart)
    localStorage.setItem('cart', JSON.stringify(nextCart))
    window.dispatchEvent(new Event('cart-change'))
  }

  const cartItems = token ? cart || [] : guestCartItems
  const isBusy = token && (isUpdating || isRemoving || isClearing || isCheckingOut)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const paymentStatus = params.get('payment')
    const sessionId = params.get('session_id') || params.get('tx_ref')

    if (!token || !paymentStatus) return

    const finalizeCheckout = async () => {
      if (paymentStatus === 'success' && sessionId) {
        try {
          await confirmPaymentSession(sessionId).unwrap()
          setPaymentInfo('Payment successful. Your order has been confirmed.')
          setPaymentError('')
          refetch()
        } catch (confirmError) {
          setPaymentError(getReadableError(confirmError, 'Payment was completed, but we could not verify it yet.'))
        }
      } else if (paymentStatus === 'cancelled') {
        setPaymentInfo('Payment was cancelled. Your cart is unchanged.')
        setPaymentError('')
      }

      navigate('/cart', { replace: true })
    }

    finalizeCheckout()
  }, [location.search, token, confirmPaymentSession, navigate, refetch])

  const summary = useMemo(() => {
    const subtotal = cartItems.reduce(
      (total, item) => total + Number(item.selling_price) * Number(item.quantity),
      0
    )
    const itemCount = cartItems.reduce((total, item) => total + Number(item.quantity), 0)
    const shipping = subtotal > 250 || subtotal === 0 ? 0 : 12
    const tax = subtotal * 0.08
    const total = subtotal + shipping + tax

    return { subtotal, itemCount, shipping, tax, total }
  }, [cartItems])

  const formatPrice = (value) => etbFormatter.format(Number(value) || 0)

  const handleQuantityChange = async (item, nextQuantity) => {
    if (nextQuantity < 1) {
      await handleRemoveItem(item.id)
      return
    }

    if (!token) {
      const nextCart = cartItems.map((cartItem) =>
        cartItem.id === item.id ? { ...cartItem, quantity: nextQuantity } : cartItem
      )
      syncGuestCart(nextCart)
      return
    }

    await updateCartItem({ id: item.id, quantity: nextQuantity }).unwrap()
  }

  const handleRemoveItem = async (itemId) => {
    if (!token) {
      const nextCart = cartItems.filter((cartItem) => cartItem.id !== itemId)
      syncGuestCart(nextCart)
      return
    }

    await removeFromCart(itemId).unwrap()
  }

  const handleClearCart = async () => {
    if (cartItems.length === 0) return

    if (!token) {
      syncGuestCart([])
      return
    }

    await clearCart().unwrap()
  }

  const handleCheckout = async () => {
    if (!token) {
      navigate('/login')
      return
    }

    setPaymentInfo('')
    setPaymentError('')

    try {
      const origin = window.location.origin
      const response = await createCheckoutSession({
        successUrl: `${origin}/payment-result?status=success`,
        cancelUrl: `${origin}/payment-result?status=cancelled`,
      }).unwrap()

      if (!response?.checkoutUrl) {
        setPaymentError('Checkout could not be started. Please try again.')
        return
      }

      window.location.href = response.checkoutUrl
    } catch (checkoutError) {
      setPaymentError(getReadableError(checkoutError, 'Unable to start secure checkout right now.'))
    }
  }

  if (token && isLoading) {
    return (
      <div className="cart-loading">
        <RefreshCw size={30} className="loading-spinner" />
        <p>Loading your cart...</p>
      </div>
    )
  }

  if (token && isError) {
    const errorMessage = error?.data?.message || 'Unable to load cart right now.'
    return (
      <div className="cart-error-state">
        <h2>Could not load your cart</h2>
        <p>{errorMessage}</p>
        <button onClick={refetch} className="retry-cart-btn">Try Again</button>
      </div>
    )
  }

  return (
    <div className="cart">
      <div className="cart-hero">
        <div className="cart-hero-glow" />
        <div className="cart-hero-content">
          <div>
            <span className="cart-badge">
              <Sparkles size={16} />
              Smart Cart
            </span>
            <h1 className="cart-title">Your Shopping Cart</h1>
            <p className="cart-subtitle">
              Review your picks, update quantities, and checkout when you are ready.
            </p>
          </div>
          <div className="cart-hero-chip">
            <ShoppingCart size={18} />
            <span>{summary.itemCount} items</span>
          </div>
        </div>
      </div>

      <div className="cart-content container">
        {(paymentInfo || paymentError) && (
          <div className={`payment-feedback ${paymentError ? 'payment-feedback-error' : 'payment-feedback-success'}`}>
            {paymentError || paymentInfo}
          </div>
        )}

        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <div className="empty-icon-wrap">
              <ShoppingBag size={34} />
            </div>
            <h2>Your cart is empty</h2>
            <p>Browse our collection and add your favorite frames.</p>
            <button onClick={() => navigate('/shop')} className="go-shop-btn">
              Go to Shop <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          <div className="cart-grid">
            <div className="cart-items-panel">
              <div className="cart-items-header">
                <h2>Cart Items</h2>
                <button
                  type="button"
                  className="clear-cart-btn"
                  onClick={handleClearCart}
                  disabled={isBusy}
                >
                  <Trash2 size={16} /> Clear Cart
                </button>
              </div>

              <div className="cart-items">
                {cartItems.map((item) => {
                  const unitPrice = Number(item.selling_price)
                  const quantity = Number(item.quantity)

                  return (
                    <motion.div
                      key={item.id}
                      className="cart-item"
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <img
                        src={item.image_url || 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=300'}
                        alt={item.name}
                      />

                      <div className="cart-item-details">
                        <h3>{item.name}</h3>
                        <p className="item-brand">{item.brand || 'Premium Collection'}</p>
                        <p className="item-unit-price">{formatPrice(unitPrice)} each</p>
                      </div>

                      <div className="cart-item-actions">
                        <div className="quantity-controls">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item, quantity - 1)}
                            disabled={isBusy}
                          >
                            <Minus size={14} />
                          </button>
                          <span>{quantity}</span>
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item, quantity + 1)}
                            disabled={isBusy}
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <div className="item-total">{formatPrice(unitPrice * quantity)}</div>

                        <button
                          type="button"
                          className="remove-item-btn"
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={isBusy}
                        >
                          <Trash2 size={16} /> Remove
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>

            <aside className="cart-summary-panel">
              <h3>Order Summary</h3>

              <div className="summary-row">
                <span>Items ({summary.itemCount})</span>
                <strong>{formatPrice(summary.subtotal)}</strong>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <strong>{summary.shipping === 0 ? 'Free' : formatPrice(summary.shipping)}</strong>
              </div>
              <div className="summary-row">
                <span>Estimated Tax</span>
                <strong>{formatPrice(summary.tax)}</strong>
              </div>

              <div className="summary-total">
                <span>Total</span>
                <strong>{formatPrice(summary.total)}</strong>
              </div>

              <button
                className="checkout-btn"
                type="button"
                disabled={isBusy}
                onClick={handleCheckout}
              >
                {token ? (isCheckingOut ? 'Redirecting...' : 'Checkout Now') : 'Sign In to Checkout'} <ArrowRight size={16} />
              </button>

              <div className="summary-note">
                <ShieldCheck size={16} />
                <span>Secure checkout with encrypted payment processing.</span>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}

export default Cart
