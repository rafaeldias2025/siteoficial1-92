import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface DadosFisicosFormData {
  dataNascimento: string;
  sexo: 'masculino' | 'feminino' | 'outro';
  pesoAtual: number;
  altura: number;
  circunferenciaAbdominal: number;
  metaPeso?: number;
}

export const DadosFisicosForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<DadosFisicosFormData>();

  const sexoValue = watch('sexo');

  const onSubmit = async (data: DadosFisicosFormData) => {
    if (!user) {
      toast.error('Você precisa estar logado para salvar os dados');
      return;
    }

    try {
      console.log('📝 Salvando dados físicos:', data);
      
      // Primeiro, buscar o profile do usuário
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('Erro ao buscar profile:', profileError);
        throw profileError;
      }

      console.log('👤 Profile encontrado:', profile);

      // Calcular IMC
      const alturaEmMetros = data.altura / 100;
      const imc = data.pesoAtual / (alturaEmMetros * alturaEmMetros);
      
      // Calcular progresso percentual se há meta
      let progressoPercentual = 0;
      if (data.metaPeso) {
        const diferencaTotal = data.pesoAtual - data.metaPeso;
        if (diferencaTotal > 0) {
          progressoPercentual = Math.max(0, Math.min(100, ((data.pesoAtual - data.metaPeso) / data.pesoAtual) * 100));
        }
      }

      // Salvar na tabela dados_saude_usuario (que é a tabela correta)
      const { error: saudeError } = await supabase
        .from('dados_saude_usuario')
        .upsert({
          user_id: profile.id,
          peso_atual_kg: data.pesoAtual,
          altura_cm: data.altura,
          circunferencia_abdominal_cm: data.circunferenciaAbdominal,
          meta_peso_kg: data.metaPeso || data.pesoAtual, // Se não há meta, usar peso atual
          imc: imc,
          progresso_percentual: progressoPercentual,
          data_atualizacao: new Date().toISOString()
        });

      if (saudeError) {
        console.error('Erro ao salvar dados de saúde:', saudeError);
        throw saudeError;
      }

      // TAMBÉM salvar na tabela informacoes_fisicas para compatibilidade
      const { error: fisicasError } = await supabase
        .from('informacoes_fisicas')
        .upsert({
          user_id: profile.id,
          data_nascimento: data.dataNascimento,
          sexo: data.sexo,
          peso_atual_kg: data.pesoAtual,
          altura_cm: data.altura,
          circunferencia_abdominal_cm: data.circunferenciaAbdominal,
          meta_peso_kg: data.metaPeso
        });

      if (fisicasError) {
        console.error('Erro ao salvar informações físicas:', fisicasError);
        // Não throw aqui, pois dados de saúde já foram salvos
      }

      console.log('✅ Dados salvos com sucesso!');
      
      // Marcar no localStorage que dados foram recém-salvos
      localStorage.setItem('dados_recem_salvos', 'true');
      
      toast.success('Dados salvos com sucesso! Gráficos atualizados.');
      
      // Forçar atualização do hook de dados físicos
      console.log('🚀 Redirecionando para página inicial...');
      navigate('/', { replace: true });
      
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      toast.error('Erro ao salvar dados. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              📝 Informações Físicas e Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Data de Nascimento */}
              <div className="space-y-2">
                <Label htmlFor="dataNascimento">📅 Data de Nascimento *</Label>
                <Input
                  id="dataNascimento"
                  type="date"
                  {...register('dataNascimento', { 
                    required: 'Data de nascimento é obrigatória' 
                  })}
                />
                <p className="text-sm text-muted-foreground">
                  Usaremos para calcular sua idade e ajustar recomendações.
                </p>
                {errors.dataNascimento && (
                  <p className="text-sm text-destructive">{errors.dataNascimento.message}</p>
                )}
              </div>

              {/* Sexo */}
              <div className="space-y-3">
                <Label>🧑‍🤝‍🧑 Sexo *</Label>
                <RadioGroup
                  value={sexoValue}
                  onValueChange={(value) => setValue('sexo', value as 'masculino' | 'feminino' | 'outro')}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="masculino" id="masculino" />
                    <Label htmlFor="masculino">Masculino</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="feminino" id="feminino" />
                    <Label htmlFor="feminino">Feminino</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="outro" id="outro" />
                    <Label htmlFor="outro">Outro</Label>
                  </div>
                </RadioGroup>
                <p className="text-sm text-muted-foreground">
                  Usamos essas informações para calcular o risco cardiometabólico, definir faixas ideais e ajustar sua silhueta.
                </p>
                {errors.sexo && (
                  <p className="text-sm text-destructive">Sexo é obrigatório</p>
                )}
              </div>

              {/* Peso Atual */}
              <div className="space-y-2">
                <Label htmlFor="pesoAtual">⚖️ Peso Atual (kg) *</Label>
                <Input
                  id="pesoAtual"
                  type="number"
                  step="0.1"
                  placeholder="70.5"
                  {...register('pesoAtual', { 
                    required: 'Peso atual é obrigatório',
                    min: { value: 30, message: 'Peso deve ser maior que 30kg' },
                    max: { value: 300, message: 'Peso deve ser menor que 300kg' }
                  })}
                />
                {errors.pesoAtual && (
                  <p className="text-sm text-destructive">{errors.pesoAtual.message}</p>
                )}
              </div>

              {/* Altura */}
              <div className="space-y-2">
                <Label htmlFor="altura">📏 Altura (cm) *</Label>
                <Input
                  id="altura"
                  type="number"
                  placeholder="170"
                  {...register('altura', { 
                    required: 'Altura é obrigatória',
                    min: { value: 100, message: 'Altura deve ser maior que 100cm' },
                    max: { value: 250, message: 'Altura deve ser menor que 250cm' }
                  })}
                />
                <p className="text-sm text-muted-foreground">
                  A altura é essencial para calcular seu IMC e gerar sua silhueta personalizada.
                </p>
                {errors.altura && (
                  <p className="text-sm text-destructive">{errors.altura.message}</p>
                )}
              </div>

              {/* Circunferência Abdominal */}
              <div className="space-y-2">
                <Label htmlFor="circunferenciaAbdominal">🔄 Circunferência Abdominal (cm) *</Label>
                <Input
                  id="circunferenciaAbdominal"
                  type="number"
                  placeholder="92"
                  {...register('circunferenciaAbdominal', { 
                    required: 'Circunferência abdominal é obrigatória',
                    min: { value: 50, message: 'Circunferência deve ser maior que 50cm' },
                    max: { value: 200, message: 'Circunferência deve ser menor que 200cm' }
                  })}
                />
                <p className="text-sm text-muted-foreground">
                  Utilizamos esse dado para avaliar o seu risco cardiometabólico e gerar os gráficos de evolução.
                </p>
                {errors.circunferenciaAbdominal && (
                  <p className="text-sm text-destructive">{errors.circunferenciaAbdominal.message}</p>
                )}
              </div>

              {/* Meta de Peso (Opcional) */}
              <div className="space-y-2">
                <Label htmlFor="metaPeso">🎯 Meta de Peso (kg) - Opcional</Label>
                <Input
                  id="metaPeso"
                  type="number"
                  step="0.1"
                  placeholder="65.0"
                  {...register('metaPeso', {
                    min: { value: 30, message: 'Meta deve ser maior que 30kg' },
                    max: { value: 300, message: 'Meta deve ser menor que 300kg' }
                  })}
                />
                <p className="text-sm text-muted-foreground">
                  Defina seu peso ideal para acompanharmos seu progresso.
                </p>
                {errors.metaPeso && (
                  <p className="text-sm text-destructive">{errors.metaPeso.message}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Salvando...' : '💾 Salvar e Continuar'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};