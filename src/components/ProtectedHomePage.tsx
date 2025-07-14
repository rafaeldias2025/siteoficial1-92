import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { usePhysicalDataComplete } from '@/hooks/usePhysicalDataComplete';
import { useDadosSaude } from '@/hooks/useDadosSaude';
import HomePage from '@/components/HomePage';
import { BeneficiosVisuais } from '@/components/BeneficiosVisuais';

const ProtectedHomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isComplete, isLoading } = usePhysicalDataComplete();
  const { dadosSaude } = useDadosSaude();
  const [showBeneficios, setShowBeneficios] = useState(false);

  useEffect(() => {
    // Se o usuário está logado e os dados estão carregados
    if (user && !isLoading) {
      console.log('Usuário autenticado detectado na página inicial:', {
        userId: user.id,
        isPhysicalDataComplete: isComplete,
        hasDadosSaude: !!dadosSaude
      });
      
      // Se tem dados de saúde, mostrar benefícios visuais
      if (dadosSaude) {
        setShowBeneficios(true);
        // Pequeno delay para mostrar os benefícios antes de ir para dashboard
        const timer = setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 10000); // 10 segundos para visualizar os benefícios
        
        // Limpar timer se componente for desmontado
        return () => clearTimeout(timer);
      } else {
        // Se não tem dados de saúde, ir direto para dashboard
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, isComplete, isLoading, navigate, dadosSaude]);

  // Mostrar benefícios visuais se dados acabaram de ser salvos
  if (user && showBeneficios && dadosSaude) {
    return (
      <div className="min-h-screen">
        <div className="bg-gradient-to-r from-instituto-orange to-instituto-gold p-4 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">🎉 Parabéns! Seus dados foram salvos com sucesso!</h2>
          <p className="text-lg mb-3">Veja como seus dados aparecem nos gráficos personalizados abaixo:</p>
          <div className="flex justify-center gap-4 items-center">
            <p className="text-sm opacity-90">Redirecionando automaticamente em 10 segundos...</p>
            <Button 
              onClick={() => navigate('/dashboard')}
              variant="outline"
              className="bg-white/20 border-white/30 text-white hover:bg-white/30"
            >
              Ir para Dashboard Agora
            </Button>
          </div>
        </div>
        <BeneficiosVisuais />
      </div>
    );
  }

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