
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import ThemeToggle from "@/components/netflix/ThemeToggle";
import { DadosFisicosForm } from "@/components/DadosFisicosForm";
import AvaliacaoSemanal from "@/components/AvaliacaoSemanal";
import { EnhancedRanking } from "@/components/visual/EnhancedRanking";
import { PublicRanking } from "@/components/PublicRanking";
import MinhasMetas from "@/components/MinhasMetas";
import Desafios from "@/components/Desafios";
import DiarioSaude from "@/components/DiarioSaude";
import MissaoDia from "@/components/MissaoDia";
import { BeneficiosVisuais } from "@/components/BeneficiosVisuais";
import { ProgressCharts } from "@/components/ProgressCharts";
import { useGoals } from "@/hooks/useGoals";
import { CompactUserHeader } from "@/components/CompactUserHeader";
import { UserProfileMenu } from "@/components/UserProfileMenu";
import { ClientSessions } from "@/components/sessions/ClientSessions";
import { RequiredDataModal } from "@/components/RequiredDataModal";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  LogOut, 
  Home,
  Trophy,
  Calendar,
  Target,
  Award,
  FileText,
  Settings,
  BarChart3,
  Scale
} from "lucide-react";

// Dados mock para ranking
const topRankingUsers = [
  {id: 1, name: "Ana Silva", points: 3200, position: 1, lastPosition: 2, streak: 25, completedChallenges: 28, cidade: "São Paulo", trend: 'up' as const, positionChange: 1},
  {id: 2, name: "Carlos Santos", points: 2800, position: 2, lastPosition: 1, streak: 20, completedChallenges: 22, cidade: "Rio de Janeiro", trend: 'down' as const, positionChange: 1},
  {id: 3, name: "Maria Costa", points: 2400, position: 3, lastPosition: 3, streak: 15, completedChallenges: 18, cidade: "Belo Horizonte", trend: 'stable' as const, positionChange: 0},
];

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState('inicio');
  const [rankingTimeFilter, setRankingTimeFilter] = useState<'week' | 'month' | 'all'>('week');

  const menuItems = [
    { id: 'inicio', label: 'Início', icon: Home },
    { id: 'sessoes', label: 'Sessões', icon: FileText },
    { id: 'ranking', label: 'Ranking', icon: Trophy },
    { id: 'avaliacao-semanal', label: 'Avaliação Semanal', icon: Calendar },
    { id: 'metas', label: 'Minhas Metas', icon: Target },
    { id: 'desafios', label: 'Desafios', icon: Award },
    { id: 'diario', label: 'Diário de Saúde', icon: FileText },
    { id: 'meu-progresso', label: 'Meu Progresso', icon: BarChart3 },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'inicio':
        return <MissaoDia isVisitor={false} />;
      case 'sessoes':
        return <ClientSessions />;
      case 'ranking':
        return (
          <div className="space-y-6">
            <EnhancedRanking 
              users={topRankingUsers}
              currentUser={topRankingUsers[0]}
              showPrizes={true}
            />
            <PublicRanking 
              timeFilter={rankingTimeFilter}
              onTimeFilterChange={setRankingTimeFilter}
            />
          </div>
        );
      case 'avaliacao-semanal':
        return <AvaliacaoSemanal />;
      case 'metas':
        return <MinhasMetas userType="cliente" />;
      case 'desafios':
        return <Desafios />;
      case 'diario':
        return <DiarioSaude />;
      case 'meu-progresso':
        return (
          <div className="space-y-8">
            <BeneficiosVisuais />
            <ProgressCharts />
          </div>
        );
      default:
        return <MissaoDia isVisitor={false} />;
    }
  };

  return (
    <div className="min-h-screen bg-netflix-dark">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-netflix-card border-r border-netflix-border min-h-screen">
          <div className="p-6">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-instituto-orange hover:opacity-90 transition-opacity mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar ao início
            </Link>
            
            <nav className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeSection === item.id 
                        ? 'bg-instituto-orange text-white' 
                        : 'text-netflix-text hover:bg-netflix-hover'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1">
          {/* Header */}
          <div className="bg-netflix-card border-b border-netflix-border p-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-netflix-text">
                {menuItems.find(item => item.id === activeSection)?.label || 'Dashboard'}
              </h1>
              <div className="flex items-center gap-4">
                <UserProfileMenu />
                <ThemeToggle />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Header compacto com dados do usuário */}
            <CompactUserHeader />
            {renderContent()}
          </div>
        </div>
      </div>
      
      {/* Modal para dados obrigatórios */}
      <RequiredDataModal />
    </div>
  );
};

export default Dashboard;