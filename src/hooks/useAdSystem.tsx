import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface AdUrls {
  id: string;
  url: string;
}

interface AdSettings {
  interval_minutes: number;
  ads_required_for_free_time: number;
  free_time_hours: number;
}

interface UserAdData {
  ad_preference: 'five_at_once' | 'one_per_40min';
  ad_free_until: string | null;
  ads_watched_count: number;
}

export const useAdSystem = () => {
  const { user } = useAuth();
  const [adPreference, setAdPreference] = useState<'five_at_once' | 'one_per_40min'>('one_per_40min');
  const [adFreeUntil, setAdFreeUntil] = useState<Date | null>(null);
  const [adUrls, setAdUrls] = useState<AdUrls[]>([]);
  const [loading, setLoading] = useState(true);
  const [adSettings, setAdSettings] = useState<AdSettings | null>(null);
  const [adsWatchedCount, setAdsWatchedCount] = useState(0);
  const [isVip, setIsVip] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    console.log('🔄 useAdSystem: Carregando configurações para user:', user.id);
    loadUserAdSettings();
    loadAdUrls();
    loadAdSettings();
  }, [user?.id]); // Usa user.id em vez de user completo para evitar re-renders

  const loadAdSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('ad_settings')
        .select('interval_minutes, ads_required_for_free_time, free_time_hours')
        .maybeSingle();

      if (data && !error) {
        setAdSettings(data);
      } else if (error) {
        console.error('Error loading ad settings:', error);
      }
    } catch (error) {
      console.error('Error loading ad settings:', error);
    }
  };

  const loadUserAdSettings = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      console.log('🔄 Carregando preferências do usuário:', user.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('ad_preference, ad_free_until, ads_watched_count, is_vip, vip_expires_at')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('❌ Erro ao carregar preferências:', error);
        setLoading(false);
        return;
      }

      if (data) {
        const preference = data.ad_preference || 'one_per_40min';
        console.log('✅ Preferência carregada do banco:', preference, 'ad_free_until:', data.ad_free_until, 'ads_watched:', data.ads_watched_count, 'is_vip:', data.is_vip);
        setAdPreference(preference);
        setAdFreeUntil(data.ad_free_until ? new Date(data.ad_free_until) : null);
        setAdsWatchedCount(data.ads_watched_count || 0);
        
        // Check VIP status and expiration
        if (data.is_vip && data.vip_expires_at) {
          const vipExpiresAt = new Date(data.vip_expires_at);
          setIsVip(vipExpiresAt > new Date());
        } else {
          setIsVip(false);
        }
      } else {
        console.warn('⚠️ Perfil não encontrado para o usuário:', user.id);
        // Mantém o valor padrão do estado inicial
      }
    } catch (error) {
      console.error('❌ Exceção ao carregar preferências:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAdUrls = async () => {
    const { data, error } = await supabase
      .from('ad_urls')
      .select('id, url')
      .eq('is_active', true)
      .limit(5);

    if (data && !error) {
      setAdUrls(data);
    }
  };

  const updateAdPreference = async (preference: 'five_at_once' | 'one_per_40min') => {
    if (!user) {
      console.error('❌ Usuário não autenticado');
      return { error: 'Usuário não autenticado' };
    }

    try {
      console.log('💾 Iniciando salvamento - Preferência:', preference, 'User ID:', user.id);
      
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id,
          email: user.email,
          ad_preference: preference,
          ads_watched_count: 0 // Reseta o contador ao mudar preferência
        }, {
          onConflict: 'id'
        });

      if (error) {
        console.error('❌ Erro ao salvar preferência:', error);
        return { error: error.message };
      }

      console.log('✅ Preferência salva no banco');
      
      // Atualiza o estado local imediatamente
      setAdPreference(preference);
      setAdsWatchedCount(0);
      
      // Verifica se foi salvo corretamente
      const { data: verifyData, error: verifyError } = await supabase
        .from('profiles')
        .select('ad_preference')
        .eq('id', user.id)
        .maybeSingle();
      
      if (!verifyError && verifyData) {
        console.log('🔍 Verificação após salvar:', verifyData.ad_preference);
      }
      
      return { error: null };
    } catch (error: any) {
      console.error('❌ Exceção ao atualizar preferência:', error);
      return { error: error.message || 'Erro desconhecido' };
    }
  };

  const incrementAdsWatched = async () => {
    if (!user) return { error: 'Usuário não autenticado' };

    const newCount = adsWatchedCount + 1;
    
    const { error } = await supabase
      .from('profiles')
      .upsert({ 
        id: user.id,
        email: user.email,
        ads_watched_count: newCount 
      }, {
        onConflict: 'id'
      });

    if (!error) {
      setAdsWatchedCount(newCount);
      console.log('✅ Progresso salvo:', newCount);
    } else {
      console.error('❌ Erro ao salvar progresso:', error);
    }

    return { error, newCount };
  };

  const watchFiveAds = async (adsWatched: number) => {
    const requiredAds = adSettings?.ads_required_for_free_time || 5;
    
    console.log('🎬 watchFiveAds chamado:', { adsWatched, requiredAds, user: !!user });
    
    if (adsWatched >= requiredAds && user) {
      const freeTimeHours = adSettings?.free_time_hours || 24;
      const adFreeUntilDate = new Date();
      adFreeUntilDate.setHours(adFreeUntilDate.getHours() + freeTimeHours);

      console.log('💾 Salvando ad_free_until:', adFreeUntilDate.toISOString());

      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id,
          email: user.email,
          ad_free_until: adFreeUntilDate.toISOString(),
          ads_watched_count: 0 // Reseta o contador após completar
        }, {
          onConflict: 'id'
        });

      if (!error) {
        console.log('✅ ad_free_until salvo com sucesso');
        setAdFreeUntil(adFreeUntilDate);
        setAdsWatchedCount(0);


      } else {
        console.error('❌ Erro ao salvar ad_free_until:', error);
      }

      return { error };
    }
    return { error: null };
  };

  const grantAdFreeTime = async (minutes: number) => {
    if (!user) return { error: 'Usuário não autenticado' };

    const adFreeUntilDate = new Date();
    adFreeUntilDate.setMinutes(adFreeUntilDate.getMinutes() + minutes);

    const { error } = await supabase
      .from('profiles')
      .upsert({ 
        id: user.id,
        email: user.email,
        ad_free_until: adFreeUntilDate.toISOString() 
      }, {
        onConflict: 'id'
      });

    if (!error) {
      setAdFreeUntil(adFreeUntilDate);


    }

    return { error };
  };

  const isAdFree = () => {
    if (isVip) return true; // VIP users are always ad-free
    if (!adFreeUntil) return false;
    return new Date() < adFreeUntil;
  };

  const getRemainingAdFreeTime = () => {
    if (!adFreeUntil || !isAdFree()) return null;

    const now = new Date();
    const diff = adFreeUntil.getTime() - now.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return { hours, minutes };
  };

  const getAdsRemainingCount = () => {
    if (adPreference !== 'five_at_once' || isAdFree()) {
      return 0;
    }

    // Sempre retorna o total necessário quando não está ad-free
    // O contador real é gerenciado no componente de anúncios
    const requiredAds = adSettings?.ads_required_for_free_time || 5;
    return requiredAds;
  };

  const needsToCompleteAds = () => {
    if (isVip) return false; // VIP users never need to complete ads
    return adPreference === 'five_at_once' && !isAdFree() && getAdsRemainingCount() > 0;
  };

  return {
    adPreference,
    adFreeUntil,
    adUrls,
    loading,
    adSettings,
    adsWatchedCount,
    isVip,
    updateAdPreference,
    incrementAdsWatched,
    watchFiveAds,
    grantAdFreeTime,
    isAdFree,
    getRemainingAdFreeTime,
    getAdsRemainingCount,
    needsToCompleteAds,
  };
};
