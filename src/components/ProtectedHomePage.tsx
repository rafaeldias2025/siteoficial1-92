import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePhysicalDataComplete } from '@/hooks/usePhysicalDataComplete';
import HomePage from '@/components/HomePage';

const ProtectedHomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isComplete, isLoading } = usePhysicalDataComplete();

  useEffect(() => {
    // Se o usuário está logado e os dados estão carregados
    if (user && !isLoading) {
      console.log('Usuário autenticado detectado na página inicial:', {
        userId: user.id,
        isPhysicalDataComplete: isComplete
      });
      
      // Redirecionar automaticamente para o dashboard
      // independente de ter dados físicos completos ou não
      // O dashboard vai cuidar de mostrar o cadastro se necessário
      navigate('/dashboard', { replace: true });
    }
  }, [user, isComplete, isLoading, navigate]);

  // Mostrar a HomePage apenas se não há usuário logado
  if (!user) {
    return <HomePage />;
  }

  // Mostrar loading ou tela em branco enquanto redireciona
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-instituto-orange mx-auto mb-4"></div>
        <p className="text-instituto-dark/70">Redirecionando...</p>
      </div>
    </div>
  );
};

export default ProtectedHomePage;