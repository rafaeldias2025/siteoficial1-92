
import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import ThemeToggle from "@/components/netflix/ThemeToggle";
import { MinhaJornada } from "@/components/MinhaJornada";
import { DadosFisicosForm } from "@/components/DadosFisicosForm";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

const Dashboard = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-netflix-dark">
      <div className="container mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-8">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-instituto-orange hover:opacity-90 transition-opacity"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar ao início
          </Link>
           <div className="flex items-center gap-4">
             <Button
               variant="outline"
               onClick={signOut}
               className="inline-flex items-center gap-2"
             >
               <LogOut className="w-4 h-4" />
               Sair
             </Button>
            <ThemeToggle />
          </div>
        </div>
        <DadosFisicosForm />
      </div>
    </div>
  );
};

export default Dashboard;