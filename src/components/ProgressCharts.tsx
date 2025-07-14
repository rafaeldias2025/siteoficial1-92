import React from 'react';
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
import { useProgressData } from '@/hooks/useProgressData';
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

const COLORS = {
  primary: 'hsl(var(--primary))',
  success: 'hsl(var(--success))',
  warning: 'hsl(var(--warning))',
  destructive: 'hsl(var(--destructive))',
  muted: 'hsl(var(--muted-foreground))'
};

export const ProgressCharts = () => {
  const { pesagens, dadosFisicos, historicoMedidas, metasPeso, loading, error } = useProgressData();

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

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Erro ao carregar dados: {error}</p>
        </CardContent>
      </Card>
    );
  }

  // Preparar dados para gráficos
  const weightData = historicoMedidas.map(item => ({
    data: format(parseISO(item.data_medicao), 'dd/MM', { locale: ptBR }),
    peso: Number(item.peso_kg),
    imc: Number(item.imc)
  }));

  const abdominalData = historicoMedidas.map(item => ({
    data: format(parseISO(item.data_medicao), 'dd/MM', { locale: ptBR }),
    circunferencia: Number(item.circunferencia_abdominal_cm)
  }));

  // Calcular progresso da meta
  const metaAtual = metasPeso[0];
  const pesoAtual = dadosFisicos?.peso_atual_kg || 0;
  const progressoMeta = metaAtual ? 
    Math.min(100, Math.max(0, ((metaAtual.peso_inicial - pesoAtual) / (metaAtual.peso_inicial - metaAtual.peso_meta)) * 100)) : 0;

  // Dados para o gráfico de composição corporal (mock data se não tiver dados reais)
  const composicaoData = pesagens.length > 0 ? [
    { name: 'Gordura', value: pesagens[pesagens.length - 1]?.gordura_corporal_pct || 25, color: COLORS.destructive },
    { name: 'Músculo', value: ((pesagens[pesagens.length - 1]?.massa_muscular_kg || 30) / pesoAtual * 100) || 35, color: COLORS.success },
    { name: 'Água', value: pesagens[pesagens.length - 1]?.agua_corporal_pct || 40, color: COLORS.primary }
  ] : [];

  // Calcular risco cardiometabólico
  const getRiscoCardio = () => {
    if (!dadosFisicos) return { nivel: 'Desconhecido', cor: COLORS.muted, porcentagem: 0 };
    
    const circunferencia = dadosFisicos.circunferencia_abdominal_cm;
    const sexo = dadosFisicos.sexo;
    
    if (sexo === 'masculino') {
      if (circunferencia < 94) return { nivel: 'Baixo', cor: COLORS.success, porcentagem: 25 };
      if (circunferencia <= 102) return { nivel: 'Moderado', cor: COLORS.warning, porcentagem: 60 };
      return { nivel: 'Alto', cor: COLORS.destructive, porcentagem: 90 };
    } else {
      if (circunferencia < 80) return { nivel: 'Baixo', cor: COLORS.success, porcentagem: 25 };
      if (circunferencia <= 88) return { nivel: 'Moderado', cor: COLORS.warning, porcentagem: 60 };
      return { nivel: 'Alto', cor: COLORS.destructive, porcentagem: 90 };
    }
  };

  const riscoCardio = getRiscoCardio();

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
                <p className="text-2xl font-bold">{pesoAtual.toFixed(1)} kg</p>
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
                <p className="text-2xl font-bold">{dadosFisicos?.imc?.toFixed(1) || 0}</p>
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
                <p className="text-2xl font-bold">{dadosFisicos?.circunferencia_abdominal_cm || 0} cm</p>
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
                <p className="text-2xl font-bold">{progressoMeta.toFixed(0)}%</p>
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                  <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={[{value: progressoMeta}]}>
                    <RadialBar 
                      dataKey="value" 
                      cornerRadius={10} 
                      fill={progressoMeta > 75 ? COLORS.success : progressoMeta > 50 ? COLORS.warning : COLORS.destructive}
                    />
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-2xl font-bold">
                      {progressoMeta.toFixed(0)}%
                    </text>
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              {metaAtual && (
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">Meta: {metaAtual.peso_meta} kg</p>
                  <p className="text-sm text-muted-foreground">
                    Faltam: {Math.max(0, pesoAtual - metaAtual.peso_meta).toFixed(1)} kg
                  </p>
                </div>
              )}
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

        {/* Composição Corporal */}
        {composicaoData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Composição Corporal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={composicaoData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {composicaoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4">
                {composicaoData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span>{item.name}</span>
                    </div>
                    <span className="font-medium">{item.value.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Evolução da Circunferência Abdominal */}
      {abdominalData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Evolução da Circunferência Abdominal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={abdominalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${value} cm`, 'Circunferência']}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="circunferencia" 
                  stroke={COLORS.warning}
                  strokeWidth={2}
                  dot={{ fill: COLORS.warning, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Tabela de Histórico Recente */}
      {historicoMedidas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico Recente de Medições</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Data</th>
                    <th className="text-left p-2">Peso (kg)</th>
                    <th className="text-left p-2">IMC</th>
                    <th className="text-left p-2">Circunf. (cm)</th>
                  </tr>
                </thead>
                <tbody>
                  {historicoMedidas.slice(-5).reverse().map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">
                        {format(parseISO(item.data_medicao), 'dd/MM/yyyy', { locale: ptBR })}
                      </td>
                      <td className="p-2">{Number(item.peso_kg).toFixed(1)}</td>
                      <td className="p-2">{Number(item.imc).toFixed(1)}</td>
                      <td className="p-2">{Number(item.circunferencia_abdominal_cm).toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};