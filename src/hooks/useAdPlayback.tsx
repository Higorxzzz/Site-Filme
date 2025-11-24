import { useState, useEffect, useRef } from "react";
import { useAdSystem } from "./useAdSystem";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

interface AdSettings {
  interval_minutes: number;
  ads_required_for_free_time: number;
  free_time_hours: number;
  redirect_url: string;
}

export const useAdPlayback = () => {
  const { user } = useAuth();
  const { adPreference, adUrls, isAdFree, grantAdFreeTime } = useAdSystem();
  const [showAdPopup, setShowAdPopup] = useState(false);
  const [currentAdUrl, setCurrentAdUrl] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [adSettings, setAdSettings] = useState<AdSettings | null>(null);
  
  const playbackStartTime = useRef<number | null>(null);
  const accumulatedTime = useRef<number>(0);
  const lastCheckTime = useRef<number>(0);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const storageKey = 'ad_playback_state';

  // Carregar configurações de anúncios e estado salvo
  useEffect(() => {
    loadAdSettings();
    loadSavedState();
  }, []);

  const loadSavedState = () => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const state = JSON.parse(saved);
        accumulatedTime.current = state.accumulatedTime || 0;
        lastCheckTime.current = state.lastCheckTime || Date.now();
      }
    } catch (error) {
      console.error('Error loading saved state:', error);
    }
  };

  const saveState = () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        accumulatedTime: accumulatedTime.current,
        lastCheckTime: lastCheckTime.current,
      }));
    } catch (error) {
      console.error('Error saving state:', error);
    }
  };

  const loadAdSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('ad_settings')
        .select('*')
        .single();

      if (data && !error) {
        setAdSettings(data);
      }
    } catch (error) {
      console.error('Error loading ad settings:', error);
    }
  };

  const getIntervalMs = () => {
    if (!adSettings) return 40 * 60 * 1000; // 40 minutos padrão
    return adSettings.interval_minutes * 60 * 1000;
  };

  // Inicia o rastreamento quando o player começa
  const startPlayback = () => {
    console.log('🎬 Iniciando playback', { 
      isAdFree: isAdFree(), 
      adPreference, 
      hasSettings: !!adSettings, 
      user: !!user 
    });
    
    if (!user) {
      console.log('⚠️ Usuário não autenticado, não verifica anúncios');
      setIsPlaying(true);
      return;
    }

    if (isAdFree()) {
      console.log('✅ Usuário está livre de anúncios - não inicia tracking');
      setIsPlaying(true);
      return;
    }

    // Só inicia tracking se for one_per_40min
    if (adPreference === 'one_per_40min') {
      if (!playbackStartTime.current) {
        playbackStartTime.current = Date.now();
      }
      lastCheckTime.current = Date.now();
      setIsPlaying(true);
      console.log('⏱️ Cronômetro iniciado - modo one_per_40min', { 
        accumulated: accumulatedTime.current, 
        intervalMs: adSettings?.interval_minutes ? adSettings.interval_minutes * 60 * 1000 : 'não carregado'
      });
    } else {
      console.log('⏭️ Modo five_at_once - não inicia tracking automático');
      setIsPlaying(true);
    }
  };

  // Para o rastreamento quando o player pausa
  const pausePlayback = () => {
    if (playbackStartTime.current) {
      const elapsed = Date.now() - lastCheckTime.current;
      accumulatedTime.current += elapsed;
      lastCheckTime.current = Date.now();
      saveState();
    }
    setIsPlaying(false);
  };

  // Reseta o rastreamento
  const resetPlayback = () => {
    playbackStartTime.current = null;
    accumulatedTime.current = 0;
    lastCheckTime.current = 0;
    setIsPlaying(false);
    localStorage.removeItem(storageKey);
  };

  // Verifica se deve mostrar o anúncio
  useEffect(() => {
    // Limpa interval anterior
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }

    console.log('🎬 useAdPlayback - Verificando condições:', { 
      isPlaying, 
      user: !!user, 
      adPreference, 
      isAdFree: isAdFree(),
      intervalMinutes: adSettings?.interval_minutes 
    });

    // Se não está tocando ou não tem configurações ou usuário, não faz nada
    if (!isPlaying || !adSettings || !user) {
      console.log('⏸️ Verificação pausada - isPlaying:', isPlaying, 'hasSettings:', !!adSettings, 'hasUser:', !!user);
      return;
    }

    // Se está livre de anúncios, não precisa verificar
    if (isAdFree()) {
      console.log('✅ Usuário livre de anúncios - não verifica');
      return;
    }

    // Só verifica se a preferência for one_per_40min
    if (adPreference !== 'one_per_40min') {
      console.log('ℹ️ Preferência é "' + adPreference + '", não mostra anúncios periódicos');
      return;
    }

    const intervalMs = getIntervalMs();
    console.log('🔄 Iniciando verificação de anúncios - intervalMs:', intervalMs, 'intervalMinutes:', adSettings.interval_minutes);

    checkIntervalRef.current = setInterval(() => {
      // Verifica novamente se está livre de anúncios (pode ter expirado durante o intervalo)
      if (isAdFree()) {
        console.log('✅ Usuário agora está livre de anúncios - parando tracking');
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
          checkIntervalRef.current = null;
        }
        return;
      }

      const elapsed = Date.now() - lastCheckTime.current;
      const totalTime = accumulatedTime.current + elapsed;
      
      console.log('⏱️ Check:', { 
        elapsed: Math.floor(elapsed / 1000) + 's', 
        accumulated: Math.floor(accumulatedTime.current / 1000) + 's',
        total: Math.floor(totalTime / 1000) + 's', 
        required: Math.floor(intervalMs / 1000) + 's',
        remaining: Math.floor((intervalMs - totalTime) / 1000) + 's'
      });

      if (totalTime >= intervalMs) {
        console.log('🎯 Tempo atingido! Mostrando anúncio');
        const adUrl = adSettings.redirect_url || (adUrls[Math.floor(Math.random() * adUrls.length)]?.url);
        if (adUrl) {
          setCurrentAdUrl(adUrl);
          setShowAdPopup(true);
          pausePlayback();
          saveState();
        } else {
          console.error('❌ Nenhuma URL de anúncio disponível');
        }
      } else {
        // Salva o estado a cada 10 segundos
        if (Math.floor(totalTime / 10000) !== Math.floor((totalTime - 1000) / 10000)) {
          saveState();
        }
      }
    }, 1000); // Verifica a cada segundo

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, [isPlaying, isAdFree, adPreference, adUrls, adSettings, user]);

  const handleAdWatched = async () => {
    console.log('🎬 Anúncio assistido, reiniciando cronômetro');
    setShowAdPopup(false);
    
    // Reseta completamente o contador para começar novo ciclo
    accumulatedTime.current = 0;
    playbackStartTime.current = Date.now();
    lastCheckTime.current = Date.now();
    saveState();
    
    // Retoma a reprodução automaticamente
    setIsPlaying(true);
    console.log('✅ Cronômetro resetado, novo ciclo iniciado');
  };

  return {
    showAdPopup,
    currentAdUrl,
    startPlayback,
    pausePlayback,
    resetPlayback,
    handleAdWatched,
    adSettings,
  };
};
