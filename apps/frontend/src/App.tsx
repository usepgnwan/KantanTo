import React from 'react';
import AppRouter from './routes/AppRouter';
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import FloatingWhatsApp from './components/atoms/FloatingWhatsApp';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <CartProvider>
        <AppRouter />
        <FloatingWhatsApp />
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </CartProvider>
    </ThemeProvider>
  );
};

export default App;
