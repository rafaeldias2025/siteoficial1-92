import React, { useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Settings, LogOut, Edit3 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { EditProfileModal } from './EditProfileModal';
import { supabase } from '@/integrations/supabase/client';

export const UserProfileMenu = () => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  React.useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        setProfile(data);
      } catch (error) {
        console.error('Erro ao buscar perfil:', error);
      }
    };

    fetchProfile();
  }, [user]);

  const handleProfileUpdate = () => {
    // Recarregar os dados do perfil após atualização
    if (user) {
      const fetchUpdatedProfile = async () => {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();
          
          setProfile(data);
        } catch (error) {
          console.error('Erro ao recarregar perfil:', error);
        }
      };
      fetchUpdatedProfile();
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-instituto-orange text-white text-sm">
                {getInitials(profile?.full_name || user?.email || 'U')}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent className="w-56 bg-white border border-instituto-orange/20" align="end" forceMount>
          <div className="flex items-center justify-start gap-2 p-2">
            <div className="flex flex-col space-y-1 leading-none">
              <p className="font-medium text-sm text-instituto-dark">
                {profile?.full_name || 'Usuário'}
              </p>
              <p className="w-[200px] truncate text-xs text-muted-foreground">
                {profile?.email || user?.email}
              </p>
            </div>
          </div>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            className="cursor-pointer hover:bg-instituto-orange/10"
            onClick={() => setShowEditModal(true)}
          >
            <Edit3 className="mr-2 h-4 w-4 text-instituto-orange" />
            <span>Editar Perfil</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem className="cursor-pointer hover:bg-instituto-orange/10">
            <Settings className="mr-2 h-4 w-4 text-instituto-orange" />
            <span>Configurações</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            className="cursor-pointer hover:bg-red-50 focus:bg-red-50"
            onClick={signOut}
          >
            <LogOut className="mr-2 h-4 w-4 text-red-600" />
            <span className="text-red-600">Sair</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditProfileModal
        trigger={showEditModal ? <div /> : null}
        userData={profile}
        onDataUpdated={() => {
          handleProfileUpdate();
          setShowEditModal(false);
        }}
      />
    </>
  );
};