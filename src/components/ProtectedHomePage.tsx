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
  const { isComplete, isLoading, clearCache } = usePhysicalDataComplete();
  const { dadosSaude, refetch } = useDadosSaude();
  const [showBeneficios, setShowBeneficios] = useState(false);
  const [hasRefetched, setHasRefetched] = useState(false);

  // Forçar refetch quando usuário vem de outro lugar
  useEffect(() => {
    if (user && !hasRefetched) {
      console.log('🔄 Forçando atualização dos dados...');
      
      // Verificar se dados foram recém-salvos
      const dadosRecemSalvos = localStorage.getItem('dados_recem_salvos');
      if (dadosRecemSalvos) {
        console.log('📊 Dados recém-salvos detectados!');
        localStorage.removeItem('dados_recem_salvos');
      }
      
      clearCache();
      refetch();
      setHasRefetched(true);
    }
  }, [user, clearCache, refetch, hasRefetched]);

  useEffect(() => {
    // Se o usuário está logado e os dados estão carregados
    if (user && !isLoading && hasRefetched) {
      console.log('Usuário autenticado detectado na página inicial:', {
        userId: user.id,
        isPhysicalDataComplete: isComplete,
        hasDadosSaude: !!dadosSaude,
        hasRefetched
      });
      
      // Verificar se dados foram recém-salvos para forçar exibição
      const dadosRecemSalvos = localStorage.getItem('dados_recem_salvos');
      
      // Se tem dados de saúde OU dados físicos completos OU dados recém-salvos, mostrar benefícios visuais
      if (dadosSaude || isComplete || dadosRecemSalvos) {
        console.log('🎯 Mostrando benefícios visuais', {
          temDadosSaude: !!dadosSaude,
          isComplete,
          dadosRecemSalvos: !!dadosRecemSalvos
        });
        setShowBeneficios(true);
        
        // Limpar flag de dados recém-salvos
        if (dadosRecemSalvos) {
          localStorage.removeItem('dados_recem_salvos');
        }
        
        // Timer para redirecionamento automático
        const timer = setTimeout(() => {
          console.log('⏰ Redirecionando para dashboard automaticamente');
          navigate('/dashboard', { replace: true });
        }, 8000); // 8 segundos para visualizar os benefícios
        
        // Limpar timer se componente for desmontado
        return () => clearTimeout(timer);
      } else {
        // Se não tem dados de saúde, ir direto para dashboard
        console.log('➡️ Redirecionando direto para dashboard (sem dados)');
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, isComplete, isLoading, navigate, dadosSaude, hasRefetched]);

  // Mostrar benefícios visuais se dados acabaram de ser salvos
  if (user && showBeneficios && (dadosSaude || isComplete)) {
    return (
      <div className="min-h-screen">
        <div className="bg-gradient-to-r from-instituto-orange to-instituto-gold p-4 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">🎉 Parabéns! Seus dados estão prontos!</h2>
          <p className="text-lg mb-3">Veja como seus dados aparecem nos gráficos personalizados abaixo:</p>
          <div className="flex justify-center gap-4 items-center">
            <p className="text-sm opacity-90">Redirecionando automaticamente em 8 segundos...</p>
            <Button 
              onClick={() => {
                console.log('👆 Usuário clicou para ir ao dashboard');
                navigate('/dashboard');
              }}
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