import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Layout from './components/Layout'
import Home from './pages/Home'
import Shop from './pages/Shop'
import Cart from './pages/Cart'
import PaymentResult from './pages/PaymentResult'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminDashboard from './pages/AdminDashboard'
import Profile from './pages/Profile'
import './App.css'

function App() {
  const location = useLocation()

  const pageVariants = {
    initial: {
      opacity: 0,
      y: 20,
    },
    in: {
      opacity: 1,
      y: 0,
    },
    out: {
      opacity: 0,
      y: -20,
    }
  }

  const pageTransition = {
    type: 'tween',
    ease: [0.22, 1, 0.36, 1],
    duration: 0.4
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="app"
      >
        <Routes location={location}>
          <Route path="/admin/*" element={<AdminDashboard />} />
        </Routes>
        
        {!location.pathname.startsWith('/admin') && (
          <Layout>
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/payment-result" element={<PaymentResult />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Routes>
          </Layout>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

export default App
