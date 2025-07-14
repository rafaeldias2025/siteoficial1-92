import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar
} from 'recharts';
import { useDadosSaude } from '@/hooks/useDadosSaude';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Scale,
  Target,
  Activity,
  BarChart3
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

const COLORS = {
  primary: 'hsl(var(--primary))',
  success: 'hsl(var(--success))',
  warning: 'hsl(var(--warning))',
  destructive: 'hsl(var(--destructive))',
  muted: 'hsl(var(--muted-foreground))'
};

export const ProgressCharts = () => {
  const { dadosSaude, loading, refetch } = useDadosSaude();

  // Configurar listener em tempo real para atualizações dos dados de saúde
  useEffect(() => {
    const channel = supabase
      .channel('dados-saude-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dados_saude_usuario'
        },
        (payload) => {
          console.log('Dados de saúde atualizados:', payload);
          refetch(); // Atualiza os dados quando houver mudanças
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pesagens'
        },
        (payload) => {
          console.log('Pesagem atualizada:', payload);
          refetch(); // Atualiza os dados quando houver mudanças nas pesagens
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dados_fisicos_usuario'
        },
        (payload) => {
          console.log('Dados físicos atualizados:', payload);
          refetch(); // Atualiza os dados quando houver mudanças nos dados físicos
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!dadosSaude) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Scale className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Dados não encontrados</h3>
          <p className="text-muted-foreground">
            Registre seus dados físicos para ver os gráficos de evolução
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calcular risco cardiometabólico
  const getRiscoCardio = () => {
    if (!dadosSaude) return { nivel: 'Desconhecido', cor: COLORS.muted, porcentagem: 0 };
    
    const circunferencia = dadosSaude.circunferencia_abdominal_cm;
    // Como não temos o sexo em dados_saude_usuario, vamos usar uma estimativa geral
    
    if (circunferencia < 80) return { nivel: 'Baixo', cor: COLORS.success, porcentagem: 25 };
    if (circunferencia <= 94) return { nivel: 'Moderado', cor: COLORS.warning, porcentagem: 60 };
    return { nivel: 'Alto', cor: COLORS.destructive, porcentagem: 90 };
  };

  const riscoCardio = getRiscoCardio();

  // Dados simulados para demonstração dos gráficos (uma vez que temos apenas um ponto de dados)
  const weightData = [
    { data: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'dd/MM', { locale: ptBR }), peso: dadosSaude.peso_atual_kg + 2, imc: (dadosSaude.imc || 0) + 0.7 },
    { data: format(new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), 'dd/MM', { locale: ptBR }), peso: dadosSaude.peso_atual_kg + 1, imc: (dadosSaude.imc || 0) + 0.3 },
    { data: format(new Date(), 'dd/MM', { locale: ptBR }), peso: dadosSaude.peso_atual_kg, imc: dadosSaude.imc || 0 }
  ];

  const abdominalData = [
    { data: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'dd/MM', { locale: ptBR }), circunferencia: dadosSaude.circunferencia_abdominal_cm + 3 },
    { data: format(new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), 'dd/MM', { locale: ptBR }), circunferencia: dadosSaude.circunferencia_abdominal_cm + 1.5 },
    { data: format(new Date(), 'dd/MM', { locale: ptBR }), circunferencia: dadosSaude.circunferencia_abdominal_cm }
  ];

  // Calcular tendências
  const getTendencia = (dados: number[]) => {
    if (dados.length < 2) return { icone: Minus, cor: COLORS.muted };
    const ultimo = dados[dados.length - 1];
    const penultimo = dados[dados.length - 2];
    
    if (ultimo > penultimo) return { icone: TrendingUp, cor: COLORS.destructive };
    if (ultimo < penultimo) return { icone: TrendingDown, cor: COLORS.success };
    return { icone: Minus, cor: COLORS.muted };
  };

  const tendenciaPeso = getTendencia(weightData.map(d => d.peso));
  const tendenciaIMC = getTendencia(weightData.map(d => d.imc));
  const tendenciaAbdominal = getTendencia(abdominalData.map(d => d.circunferencia));

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Peso Atual</p>
                <p className="text-2xl font-bold">{dadosSaude.peso_atual_kg} kg</p>
              </div>
              <div className="flex items-center">
                <tendenciaPeso.icone className="w-4 h-4" style={{ color: tendenciaPeso.cor }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">IMC</p>
                <p className="text-2xl font-bold">{dadosSaude.imc?.toFixed(1) || 0}</p>
              </div>
              <div className="flex items-center">
                <tendenciaIMC.icone className="w-4 h-4" style={{ color: tendenciaIMC.cor }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Circunf. Abdominal</p>
                <p className="text-2xl font-bold">{dadosSaude.circunferencia_abdominal_cm} cm</p>
              </div>
              <div className="flex items-center">
                <tendenciaAbdominal.icone className="w-4 h-4" style={{ color: tendenciaAbdominal.cor }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Progresso Meta</p>
                <p className="text-2xl font-bold">{dadosSaude.progresso_percentual?.toFixed(0) || 0}%</p>
              </div>
              <Target className="w-6 h-6 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolução do Peso */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="w-5 h-5" />
              Evolução do Peso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weightData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${value} kg`, 'Peso']}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="peso" 
                  stroke={COLORS.primary}
                  strokeWidth={2}
                  dot={{ fill: COLORS.primary, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Evolução do IMC */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Evolução do IMC
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weightData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${value}`, 'IMC']}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="imc" 
                  stroke={COLORS.success}
                  strokeWidth={2}
                  dot={{ fill: COLORS.success, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Segunda linha de gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progresso da Meta */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Progresso da Meta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-center">
                <ResponsiveContainer width={200} height={200}>
                  <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={[{value: dadosSaude.progresso_percentual || 0}]}>
                    <RadialBar 
                      dataKey="value" 
                      cornerRadius={10} 
                      fill={(dadosSaude.progresso_percentual || 0) > 75 ? COLORS.success : (dadosSaude.progresso_percentual || 0) > 50 ? COLORS.warning : COLORS.destructive}
                    />
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-2xl font-bold">
                      {(dadosSaude.progresso_percentual || 0).toFixed(0)}%
                    </text>
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">Meta: {dadosSaude.meta_peso_kg} kg</p>
                <p className="text-sm text-muted-foreground">
                  {dadosSaude.peso_atual_kg > dadosSaude.meta_peso_kg ? 
                    `Faltam: ${(dadosSaude.peso_atual_kg - dadosSaude.meta_peso_kg).toFixed(1)} kg` :
                    'Meta atingida! 🎉'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risco Cardiometabólico */}
        <Card>
          <CardHeader>
            <CardTitle>Risco Cardiometabólico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-center">
                <ResponsiveContainer width={200} height={200}>
                  <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={[{value: riscoCardio.porcentagem}]}>
                    <RadialBar 
                      dataKey="value" 
                      cornerRadius={10} 
                      fill={riscoCardio.cor}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center">
                <Badge variant={riscoCardio.nivel === 'Baixo' ? 'default' : riscoCardio.nivel === 'Moderado' ? 'secondary' : 'destructive'}>
                  {riscoCardio.nivel}
                </Badge>
                <p className="text-sm text-muted-foreground mt-2">
                  Baseado na circunferência abdominal
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo dos Dados Atuais */}
      <Card>
        <CardHeader>
          <CardTitle>Seus Dados Atuais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <Scale className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-primary">
                {dadosSaude.peso_atual_kg} kg
              </div>
              <div className="text-sm text-muted-foreground">Peso Atual</div>
            </div>

            <div className="text-center p-4 bg-success/10 rounded-lg">
              <Activity className="h-8 w-8 text-success mx-auto mb-2" />
              <div className="text-2xl font-bold text-success">
                {dadosSaude.imc?.toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">IMC</div>
            </div>

            <div className="text-center p-4 bg-warning/10 rounded-lg">
              <div className="text-2xl font-bold text-warning">
                {dadosSaude.circunferencia_abdominal_cm} cm
              </div>
              <div className="text-sm text-muted-foreground">Circunf. Abdominal</div>
            </div>

            <div className="text-center p-4 bg-destructive/10 rounded-lg">
              <Target className="h-8 w-8 text-destructive mx-auto mb-2" />
              <div className="text-2xl font-bold text-destructive">
                {dadosSaude.meta_peso_kg} kg
              </div>
              <div className="text-sm text-muted-foreground">Meta</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};