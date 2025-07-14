import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ProgressData {
  pesagens: any[];
  dadosFisicos: any;
  historicoMedidas: any[];
  metasPeso: any[];
  loading: boolean;
  error: string | null;
}

export const useProgressData = () => {
  const { user } = useAuth();
  const [data, setData] = useState<ProgressData>({
    pesagens: [],
    dadosFisicos: null,
    historicoMedidas: [],
    metasPeso: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    if (!user) return;

    const fetchProgressData = async () => {
      try {
        setData(prev => ({ ...prev, loading: true, error: null }));

        // Buscar profile do usuário
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!profile) {
          throw new Error('Profile não encontrado');
        }

        // Buscar dados físicos atuais
        const { data: dadosFisicos } = await supabase
          .from('dados_fisicos_usuario')
          .select('*')
          .eq('user_id', profile.id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();

        // Buscar histórico de pesagens
        const { data: pesagens } = await supabase
          .from('pesagens')
          .select('*')
          .eq('user_id', profile.id)
          .order('data_medicao', { ascending: true });

        // Buscar histórico de medidas
        const { data: historicoMedidas } = await supabase
          .from('historico_medidas')
          .select('*')
          .eq('user_id', profile.id)
          .order('data_medicao', { ascending: true });

        // Buscar metas de peso
        const { data: metasPeso } = await supabase
          .from('weight_goals')
          .select('*')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false });

        setData({
          pesagens: pesagens || [],
          dadosFisicos: dadosFisicos || null,
          historicoMedidas: historicoMedidas || [],
          metasPeso: metasPeso || [],
          loading: false,
          error: null
        });

      } catch (error) {
        console.error('Erro ao buscar dados de progresso:', error);
        setData(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        }));
      }
    };

    fetchProgressData();
  }, [user]);

  return data;
};