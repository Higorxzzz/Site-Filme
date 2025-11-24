import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export const useVip = () => {
  const { user } = useAuth();
  const [isVip, setIsVip] = useState(false);
  const [vipExpiresAt, setVipExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [testPaymentEnabled, setTestPaymentEnabled] = useState(false);
  const [vipDurationDays, setVipDurationDays] = useState(30);
  const [vipPrice, setVipPrice] = useState(19.90);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    loadVipStatus();
    loadVipSettings();

    // Subscribe to profile changes
    const profileChannel = supabase
      .channel('profile-vip-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          const newData = payload.new as any;
          setIsVip(newData.is_vip);
          setVipExpiresAt(newData.vip_expires_at);
        }
      )
      .subscribe();

    // Subscribe to VIP settings changes for realtime price updates
    const settingsChannel = supabase
      .channel('vip-settings-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'vip_settings'
        },
        (payload) => {
          const newData = payload.new as any;
          setTestPaymentEnabled(newData.test_payment_enabled);
          setVipDurationDays(newData.vip_duration_days || 30);
          setVipPrice(newData.vip_price || 19.90);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(settingsChannel);
    };
  }, [user]);

  const loadVipStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_vip, vip_expires_at')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      // Check if VIP is expired
      if (data.is_vip && data.vip_expires_at) {
        const expiresAt = new Date(data.vip_expires_at);
        if (expiresAt < new Date()) {
          // VIP expired, update status
          await supabase
            .from('profiles')
            .update({ is_vip: false })
            .eq('id', user.id);
          
          setIsVip(false);
          setVipExpiresAt(null);
          toast.info("Seu plano VIP expirou");
        } else {
          setIsVip(data.is_vip);
          setVipExpiresAt(data.vip_expires_at);
        }
      } else {
        setIsVip(data.is_vip);
        setVipExpiresAt(data.vip_expires_at);
      }
    } catch (error) {
      console.error('Error loading VIP status:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVipSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('vip_settings')
        .select('test_payment_enabled, vip_duration_days, vip_price')
        .single();

      if (error) throw error;
      setTestPaymentEnabled(data.test_payment_enabled);
      setVipDurationDays(data.vip_duration_days || 30);
      setVipPrice(data.vip_price || 19.90);
    } catch (error) {
      console.error('Error loading VIP settings:', error);
    }
  };

  const activateVip = async () => {
    if (!user) {
      toast.error("Você precisa estar logado");
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('vip-activate', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      toast.success("VIP ativado com sucesso! Você está livre de anúncios por 30 dias.");
      await loadVipStatus();
    } catch (error) {
      console.error('Error activating VIP:', error);
      toast.error("Erro ao ativar VIP");
    }
  };

  return {
    isVip,
    vipExpiresAt,
    loading,
    testPaymentEnabled,
    vipDurationDays,
    vipPrice,
    activateVip,
    refreshVipStatus: loadVipStatus
  };
};