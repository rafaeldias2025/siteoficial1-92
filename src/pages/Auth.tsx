import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, User, Eye, EyeOff, CheckCircle, AlertCircle, Phone, Users, Award, ChevronRight, Calendar, UserCheck, Ruler } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import butterflyLogo from '@/assets/butterfly-logo.png';
// import CadastroCompletoForm from '@/components/CadastroCompletoForm'; // Removido

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [celular, setCelular] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [sexo, setSexo] = useState('');
  const [altura, setAltura] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showCadastroCompleto, setShowCadastroCompleto] = useState(false);
  const [userType, setUserType] = useState<'visitante' | 'cliente' | null>(null);
  const {
    signIn,
    signUp,
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);
  const validateEmail = (email: string) => {
    if (!email.trim()) {
      setEmailError('E-mail é obrigatório');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Por favor, digite um e-mail válido (exemplo: nome@email.com)');
      return false;
    }
    setEmailError('');
    return true;
  };
  const validatePassword = (password: string) => {
    if (!password.trim()) {
      setPasswordError('Senha é obrigatória');
      return false;
    }
    if (password.length < 6) {
      setPasswordError('A senha deve ter pelo menos 6 caracteres');
      return false;
    }
    if (password.length > 50) {
      setPasswordError('A senha deve ter no máximo 50 caracteres');
      return false;
    }
    setPasswordError('');
    return true;
  };
  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return {
      strength: 0,
      label: '',
      color: ''
    };
    if (password.length < 6) return {
      strength: 25,
      label: 'Muito fraca',
      color: 'bg-red-500'
    };
    if (password.length < 8) return {
      strength: 50,
      label: 'Fraca',
      color: 'bg-orange-500'
    };
    if (password.length < 12 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
      return {
        strength: 75,
        label: 'Boa',
        color: 'bg-yellow-500'
      };
    }
    if (password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[!@#$%^&*]/.test(password)) {
      return {
        strength: 100,
        label: 'Muito forte',
        color: 'bg-green-500'
      };
    }
    return {
      strength: 50,
      label: 'Razoável',
      color: 'bg-blue-500'
    };
  };
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (!validateEmail(email) || !validatePassword(password)) {
      setLoading(false);
      return;
    }
    const {
      error
    } = await signIn(email, password);
    if (error) {
      toast({
        title: "❌ Erro no Login",
        description: error.message === 'Invalid login credentials' ? "E-mail ou senha incorretos. Verifique suas credenciais." : "Erro ao fazer login. Tente novamente.",
        variant: "destructive"
      });
    } else {
      // Verificar se é admin antes de redirecionar
      try {
        const {
          data: {
            user: currentUser
          }
        } = await supabase.auth.getUser();
        if (currentUser) {
          const {
            data: profile
          } = await supabase.from('profiles').select('role').eq('user_id', currentUser.id).single();

          // Salvar tipo de usuário como cliente (se já está logando)
          localStorage.setItem('userType', 'cliente');
          if (profile?.role === 'admin') {
            toast({
              title: "✨ Bem-vindo Administrador!",
              description: "Redirecionando para o painel administrativo..."
            });
            navigate('/admin');
          } else {
            toast({
              title: "✨ Bem-vindo de volta!",
              description: "Login realizado com sucesso. Redirecionando..."
            });
            navigate('/dashboard');
          }
        }
      } catch (error) {
        console.error('Erro ao verificar role:', error);
        // Salvar tipo de usuário como cliente mesmo com erro
        localStorage.setItem('userType', 'cliente');
        navigate('/dashboard');
      }
    }
    setLoading(false);
  };
  const migrateVisitorData = () => {
    // Migrar dados salvos localmente do visitante para o perfil
    const visitorData = localStorage.getItem('visitor_data');
    if (visitorData) {
      try {
        const data = JSON.parse(visitorData);
        // Aqui você pode implementar a lógica para migrar os dados
        // Por exemplo, salvar progresso de sessões, respostas, etc.
        console.log('Dados do visitante migrados:', data);
        localStorage.removeItem('visitor_data');
      } catch (error) {
        console.error('Erro ao migrar dados do visitante:', error);
      }
    }
  };
  const handleVisitorAccess = () => {
    // Para visitantes, salvar no localStorage que é visitante e redirecionar
    localStorage.setItem('userType', 'visitante');
    navigate('/dashboard');
  };
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (!fullName.trim()) {
      toast({
        title: "❌ Nome obrigatório",
        description: "Por favor, digite seu nome completo.",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }
    if (!celular.trim()) {
      toast({
        title: "❌ Celular obrigatório",
        description: "Por favor, digite seu celular com DDD.",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }
    if (!dataNascimento.trim()) {
      toast({
        title: "❌ Data de nascimento obrigatória",
        description: "Por favor, informe sua data de nascimento.",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }
    if (!sexo.trim()) {
      toast({
        title: "❌ Sexo obrigatório",
        description: "Por favor, selecione seu sexo.",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }
    if (!altura.trim() || isNaN(Number(altura)) || Number(altura) < 100 || Number(altura) > 250) {
      toast({
        title: "❌ Altura inválida",
        description: "Por favor, informe uma altura válida entre 100 e 250 cm.",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }
    if (!validateEmail(email) || !validatePassword(password)) {
      setLoading(false);
      return;
    }
    const {
      error
    } = await signUp(email, password, fullName, celular, dataNascimento, sexo, Number(altura));
    if (error) {
      let errorMessage = "Erro ao criar conta. Tente novamente.";
      if (error.message.includes('already registered') || error.message.includes('User already registered')) {
        errorMessage = "📧 Este e-mail já está cadastrado! Tente fazer login ou use outro e-mail.";
      } else if (error.message.includes('Password should be')) {
        errorMessage = "🔒 A senha deve ter pelo menos 6 caracteres.";
      } else if (error.message.includes('Invalid email')) {
        errorMessage = "📧 E-mail inválido. Verifique se digitou corretamente.";
      } else if (error.message.includes('Signup requires a valid password')) {
        errorMessage = "🔒 Senha inválida. Use pelo menos 6 caracteres.";
      } else if (error.message.includes('Unable to validate email address')) {
        errorMessage = "📧 Não foi possível validar o e-mail. Verifique se está correto.";
      }
      toast({
        title: "❌ Erro no Cadastro",
        description: errorMessage,
        variant: "destructive"
      });
    } else {
      // Migrar dados do visitante se existirem
      migrateVisitorData();

      // Salvar tipo de usuário
      localStorage.setItem('userType', 'cliente');
      toast({
        title: "🎉 Conta criada com sucesso!",
        description: "Redirecionando para o dashboard..."
      });

      // Redirecionar direto para dashboard (formulário removido)
      navigate('/dashboard');
    }
    setLoading(false);
  };
  const handleCadastroCompletoFinish = () => {
    setShowCadastroCompleto(false);
    navigate('/dashboard');
  };

  // Cadastro completo removido - dados físicos excluídos
  // if (showCadastroCompleto) {
  //   return <div>Formulário removido</div>;
  // }

  // Se ainda não escolheu o tipo de usuário, mostrar seleção
  if (!userType) {
    return <div className="min-h-screen bg-gradient-to-br from-instituto-light via-white to-instituto-cream flex items-center justify-center p-4">
        <div className="w-full max-w-4xl space-y-6">
          {/* Logo e Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <img src={butterflyLogo} alt="Instituto dos Sonhos" className="w-16 h-16" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-instituto-dark">Instituto dos Sonhos</h1>
              <p className="text-instituto-dark/70 mt-2">Sua jornada de transformação começa aqui</p>
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-instituto-dark mb-2">Como você gostaria de começar?</h2>
            <p className="text-instituto-dark/70">Escolha a opção que melhor se adequa ao seu perfil</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Área do Visitante */}
            <Card onClick={() => setUserType('visitante')} className="shadow-warm cursor-pointer hover:shadow-lg transition-all duration-300 group border-2 hover:border-instituto-purple/50 bg-stone-300">
              <CardContent className="p-8">
                <div className="mb-6">
                  <div className="w-20 h-20 bg-instituto-purple/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-10 w-10 text-instituto-purple" />
                  </div>
                  <h3 className="text-2xl font-bold text-instituto-dark mb-4">
                    Sou Visitante
                  </h3>
                  <p className="text-instituto-dark/70 mb-6">
                    Explore conteúdos gratuitos, veja benefícios e participe do ranking público
                  </p>
                </div>
                
                <div className="space-y-3 text-left">
                  <div className="flex items-center gap-3 text-instituto-dark/70">
                    <ChevronRight className="h-4 w-4 text-instituto-purple" />
                    <span>Acesso ao ranking público</span>
                  </div>
                  <div className="flex items-center gap-3 text-instituto-dark/70">
                    <ChevronRight className="h-4 w-4 text-instituto-purple" />
                    <span>Missões diárias gratuitas</span>
                  </div>
                  <div className="flex items-center gap-3 text-instituto-dark/70">
                    <ChevronRight className="h-4 w-4 text-instituto-purple" />
                    <span>Conteúdos de bem-estar</span>
                  </div>
                  <div className="flex items-center gap-3 text-instituto-dark/70">
                    <ChevronRight className="h-4 w-4 text-instituto-purple" />
                    <span>Testes e avaliações básicos</span>
                  </div>
                </div>
                
                <Button className="w-full mt-6 bg-instituto-purple hover:bg-instituto-purple/90 text-white group-hover:scale-105 transition-transform">
                  Explorar como Visitante
                </Button>
              </CardContent>
            </Card>

            {/* Área do Cliente */}
            <Card className="shadow-warm cursor-pointer hover:shadow-lg transition-all duration-300 group border-2 hover:border-instituto-orange/50" onClick={() => setUserType('cliente')}>
              <CardContent className="p-8 bg-red-50">
                <div className="mb-6">
                  <div className="w-20 h-20 bg-instituto-orange/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award className="h-10 w-10 text-instituto-orange" />
                  </div>
                  <h3 className="text-2xl font-bold text-instituto-dark mb-4">
                    Sou Cliente
                  </h3>
                  <p className="text-instituto-dark/70 mb-6">
                    Acesso completo a todos os cursos, acompanhamento personalizado e ferramentas avançadas
                  </p>
                </div>
                
                <div className="space-y-3 text-left">
                  <div className="flex items-center gap-3 text-instituto-dark/70">
                    <ChevronRight className="h-4 w-4 text-instituto-orange" />
                    <span>Biblioteca completa de cursos</span>
                  </div>
                  <div className="flex items-center gap-3 text-instituto-dark/70">
                    <ChevronRight className="h-4 w-4 text-instituto-orange" />
                    <span>Acompanhamento personalizado</span>
                  </div>
                  <div className="flex items-center gap-3 text-instituto-dark/70">
                    <ChevronRight className="h-4 w-4 text-instituto-orange" />
                    <span>Diário de saúde privado</span>
                  </div>
                  <div className="flex items-center gap-3 text-instituto-dark/70">
                    <ChevronRight className="h-4 w-4 text-instituto-orange" />
                    <span>Metas e progresso avançado</span>
                  </div>
                </div>
                
                <Button className="w-full mt-6 bg-instituto-orange hover:bg-instituto-orange-hover text-white group-hover:scale-105 transition-transform">
                  Acessar Área do Cliente
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center text-sm text-instituto-dark/70 mt-8">
            Você pode alterar sua escolha a qualquer momento no dashboard
          </div>
        </div>
      </div>;
  }

  // Se escolheu visitante, mostrar opção de continuar sem cadastro
  if (userType === 'visitante') {
    return <div className="min-h-screen bg-gradient-to-br from-instituto-light via-white to-instituto-cream flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Logo e Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <img src={butterflyLogo} alt="Instituto dos Sonhos" className="w-16 h-16" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-instituto-dark">Bem-vindo, Visitante!</h1>
              <p className="text-instituto-dark/70 mt-2">Como gostaria de continuar?</p>
            </div>
          </div>

          <Card className="shadow-warm">
            <CardContent className="p-6 space-y-4">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-instituto-purple/20 rounded-full flex items-center justify-center mx-auto">
                  <Users className="h-8 w-8 text-instituto-purple" />
                </div>
                <p className="text-instituto-dark/70">
                  Como visitante, você pode explorar nosso conteúdo gratuito sem precisar se cadastrar.
                </p>
              </div>

              <div className="space-y-3">
                <Button onClick={handleVisitorAccess} className="w-full bg-instituto-purple hover:bg-instituto-purple/90 text-white" size="lg">
                  Continuar como Visitante
                </Button>
                
                <div className="text-center">
                  <span className="text-instituto-dark/50 text-sm">ou</span>
                </div>
                
                <Button onClick={() => setUserType('cliente')} variant="outline" className="w-full border-instituto-orange text-instituto-orange hover:bg-instituto-orange hover:text-white" size="lg">
                  Criar Conta para Mais Benefícios
                </Button>
              </div>

              <div className="text-center pt-4">
                <button onClick={() => setUserType(null)} className="text-instituto-dark/50 text-sm hover:text-instituto-dark transition-colors">
                  ← Voltar à seleção
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-instituto-light via-white to-instituto-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo e Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <img src={butterflyLogo} alt="Instituto dos Sonhos" className="w-16 h-16" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-instituto-dark">Instituto dos Sonhos</h1>
            <p className="text-instituto-dark/70 mt-2">Área do Cliente - Faça login ou crie sua conta</p>
          </div>
        </div>


        {/* Formulários de Login/Cadastro */}
        <Card className="shadow-warm">
          <CardHeader className="text-center">
            <CardTitle className="text-instituto-dark">Entre em sua conta</CardTitle>
            <CardDescription>
              Ou crie uma conta gratuita para desbloquear todo o conteúdo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Criar Conta</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input type="email" placeholder="Seu e-mail" value={email} onChange={e => {
                      setEmail(e.target.value);
                      if (emailError) validateEmail(e.target.value);
                    }} className="pl-10" required />
                    </div>
                    {emailError && <div className="flex items-center gap-2 text-red-500 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        {emailError}
                      </div>}
                  </div>

                  <div className="space-y-2">
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input type={showPassword ? "text" : "password"} placeholder="Sua senha" value={password} onChange={e => {
                      setPassword(e.target.value);
                      if (passwordError) validatePassword(e.target.value);
                    }} className="pl-10 pr-10" required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff /> : <Eye />}
                      </button>
                    </div>
                    {passwordError && <div className="flex items-center gap-2 text-red-500 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        {passwordError}
                      </div>}
                  </div>

                  <Button type="submit" className="w-full bg-instituto-orange hover:bg-instituto-orange-hover" disabled={loading} size="lg">
                    {loading ? "Entrando..." : "Entrar"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input type="text" placeholder="Seu nome completo" value={fullName} onChange={e => setFullName(e.target.value)} className="pl-10" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input type="tel" placeholder="Celular com DDD (11) 99999-9999" value={celular} onChange={e => setCelular(e.target.value)} className="pl-10" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input type="date" placeholder="Data de nascimento" value={dataNascimento} onChange={e => setDataNascimento(e.target.value)} className="pl-10" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="relative">
                      <UserCheck className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Select value={sexo} onValueChange={setSexo}>
                        <SelectTrigger className="pl-10">
                          <SelectValue placeholder="Selecione seu sexo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="masculino">Masculino</SelectItem>
                          <SelectItem value="feminino">Feminino</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="relative">
                      <Ruler className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        type="number" 
                        placeholder="Altura em centímetros (ex: 170)" 
                        value={altura} 
                        onChange={e => setAltura(e.target.value)} 
                        className="pl-10" 
                        min="100" 
                        max="250" 
                        required 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input type="email" placeholder="Seu melhor e-mail" value={email} onChange={e => {
                      setEmail(e.target.value);
                      if (emailError) validateEmail(e.target.value);
                    }} className="pl-10" required />
                    </div>
                    {emailError && <div className="flex items-center gap-2 text-red-500 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        {emailError}
                      </div>}
                    {email && !emailError && <div className="flex items-center gap-2 text-green-600 text-sm">
                        <CheckCircle className="h-4 w-4" />
                        E-mail válido
                      </div>}
                  </div>

                  <div className="space-y-2">
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input type={showPassword ? "text" : "password"} placeholder="Crie uma senha (mín. 6 caracteres)" value={password} onChange={e => {
                      setPassword(e.target.value);
                      if (passwordError) validatePassword(e.target.value);
                    }} className="pl-10 pr-10" required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff /> : <Eye />}
                      </button>
                    </div>
                    {passwordError && <div className="flex items-center gap-2 text-red-500 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        {passwordError}
                      </div>}
                    {password && !passwordError && <div className="space-y-2">
                        <div className="flex items-center gap-2 text-green-600 text-sm">
                          <CheckCircle className="h-4 w-4" />
                          Senha válida
                        </div>
                        {/* Indicador de força da senha */}
                        {(() => {
                      const strength = getPasswordStrength(password);
                      return strength.strength > 0 ? <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-instituto-dark/70">Força da senha:</span>
                                <span className={`font-medium ${strength.strength >= 75 ? 'text-green-600' : strength.strength >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                  {strength.label}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className={`h-2 rounded-full transition-all duration-300 ${strength.color}`} style={{
                            width: `${strength.strength}%`
                          }} />
                              </div>
                            </div> : null;
                    })()}
                      </div>}
                  </div>

                  <Button type="submit" className="w-full bg-instituto-orange hover:bg-instituto-orange-hover" disabled={loading} size="lg">
                    {loading ? "Criando conta..." : "Criar Conta Gratuita"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <div className="text-center text-sm text-instituto-dark/70">
            Ao continuar, você concorda com nossos Termos de Uso
          </div>
          
          <div className="text-center">
            <button onClick={() => setUserType(null)} className="text-instituto-dark/50 text-sm hover:text-instituto-dark transition-colors">
              ← Voltar à seleção de perfil
            </button>
          </div>
        </div>
      </div>
    </div>;
};
export default Auth;