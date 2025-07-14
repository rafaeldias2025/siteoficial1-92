
import React, { useEffect, useState } from 'react';
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
}

export const DadosFisicosForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [existingData, setExistingData] = useState<any>(null);
  const [hasExistingData, setHasExistingData] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<DadosFisicosFormData>();

  const sexoValue = watch('sexo');

  useEffect(() => {
    checkExistingData();
  }, [user]);

  const checkExistingData = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      const { data: existingPhysicalData } = await supabase
        .from('dados_fisicos_usuario')
        .select('*')
        .eq('user_id', profile.id)
        .single();

      if (existingPhysicalData) {
        setExistingData(existingPhysicalData);
        setHasExistingData(true);
        setValue('dataNascimento', existingPhysicalData.data_nascimento);
        setValue('sexo', existingPhysicalData.sexo as 'masculino' | 'feminino' | 'outro');
        setValue('altura', existingPhysicalData.altura_cm);
        setValue('pesoAtual', existingPhysicalData.peso_atual_kg);
        setValue('circunferenciaAbdominal', existingPhysicalData.circunferencia_abdominal_cm);
      }
    } catch (error) {
      console.error('Erro ao verificar dados existentes:', error);
    } finally {
      setLoading(false);
    }
  };

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

      // Salvar na tabela dados_saude_usuario (SEM campos calculados)
      const { error: saudeError } = await supabase
        .from('dados_saude_usuario')
        .upsert({
          user_id: profile.id,
          peso_atual_kg: Number(data.pesoAtual),
          altura_cm: Number(data.altura),
          circunferencia_abdominal_cm: Number(data.circunferenciaAbdominal),
          meta_peso_kg: Number(data.pesoAtual) // Usar peso atual como meta inicial
          // IMC, progresso_percentual e data_atualizacao são calculados automaticamente
        });

      if (saudeError) {
        console.error('Erro ao salvar dados de saúde:', saudeError);
        throw saudeError;
      }

      console.log('✅ Dados de saúde salvos com sucesso!');

      // Salvar dados físicos permanentes
      const { error: fisicosError } = await supabase
        .from('dados_fisicos_usuario')
        .upsert({
          user_id: profile.id,
          nome_completo: 'Nome do Usuário', // TODO: pegar do profile
          data_nascimento: data.dataNascimento,
          sexo: data.sexo,
          peso_atual_kg: Number(data.pesoAtual),
          altura_cm: Number(data.altura),
          circunferencia_abdominal_cm: Number(data.circunferenciaAbdominal),
          meta_peso_kg: Number(data.pesoAtual) // Usar peso atual como meta inicial
        });

      if (fisicosError) {
        console.error('Erro ao salvar dados físicos:', fisicosError);
        throw fisicosError;
      }

      console.log('✅ Dados salvos com sucesso!');
      
      toast.success('Dados físicos salvos permanentemente! Não será necessário preencher novamente.');
      
      // Atualizar estado local
      setHasExistingData(true);
      checkExistingData();
      
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      toast.error('Erro ao salvar dados. Tente novamente.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-instituto-orange mx-auto"></div>
          <p className="text-muted-foreground mt-4">Verificando dados existentes...</p>
        </div>
      </div>
    );
  }

  if (hasExistingData) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">
                ✅ Dados Físicos Já Cadastrados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-green-800 text-center mb-4">
                  Seus dados físicos já estão salvos no sistema e não precisam ser preenchidos novamente.
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Data de Nascimento:</strong> {existingData?.data_nascimento}</div>
                  <div><strong>Sexo:</strong> {existingData?.sexo}</div>
                  <div><strong>Altura:</strong> {existingData?.altura_cm}cm</div>
                  <div><strong>Peso Atual:</strong> {existingData?.peso_atual_kg}kg</div>
                  <div><strong>Circunf. Abdominal:</strong> {existingData?.circunferencia_abdominal_cm}cm</div>
                  <div><strong>IMC:</strong> {existingData?.imc?.toFixed(1)}</div>
                </div>
              </div>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="pesoAtual">⚖️ Atualizar Peso Atual (kg)</Label>
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
                  <p className="text-sm text-muted-foreground">
                    Apenas o peso pode ser atualizado. Outros dados físicos permanecem fixos.
                  </p>
                  {errors.pesoAtual && (
                    <p className="text-sm text-destructive">{errors.pesoAtual.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="circunferenciaAbdominal">🔄 Atualizar Circunferência Abdominal (cm)</Label>
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
                  {errors.circunferenciaAbdominal && (
                    <p className="text-sm text-destructive">{errors.circunferenciaAbdominal.message}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Atualizando...' : '💾 Atualizar Medidas'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              📝 Cadastro Inicial - Dados Físicos
            </CardTitle>
            <p className="text-center text-muted-foreground">
              Estes dados serão salvos permanentemente e não precisarão ser preenchidos novamente
            </p>
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

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Salvando...' : '💾 Salvar Dados Permanentemente'}
                </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
