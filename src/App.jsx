import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './features/auth/AuthContext';
import { IdentidadVisualProvider } from './contexts/IdentidadVisualContext';
import AppRoutes from './routes/AppRoutes';
import AudioGuard from './components/common/AudioGuard';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <IdentidadVisualProvider>
          <AudioGuard />
          <AppRoutes />
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        </IdentidadVisualProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
