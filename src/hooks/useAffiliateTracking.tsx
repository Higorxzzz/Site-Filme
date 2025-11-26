import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// Cookie helper functions
const setCookie = (name: string, value: string, days: number) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  console.log(`🍪 Cookie salvo: ${name}=${value}`);
};

const getCookie = (name: string): string | null => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

export const useAffiliateTracking = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const refCode = searchParams.get('ref');
    
    if (refCode) {
      console.log(`📍 Código de afiliado detectado na URL: ${refCode}`);
      
      // Salvar em localStorage
      localStorage.setItem('affiliate_ref', refCode);
      console.log(`💾 Código salvo no localStorage: ${refCode}`);
      
      // Salvar em cookie (30 dias)
      setCookie('affiliate_ref', refCode, 30);
      
      // Registrar o clique via edge function
      const registerClick = async () => {
        try {
          console.log(`🖱️ Registrando clique para o afiliado: ${refCode}`);
          const { error } = await supabase.functions.invoke('affiliate-track', {
            body: {
              action: 'click',
              affiliateCode: refCode
            }
          });
          
          if (error) {
            console.error('❌ Erro ao registrar clique:', error);
          } else {
            console.log('✅ Clique registrado com sucesso');
          }
        } catch (error) {
          console.error('❌ Erro ao chamar edge function:', error);
        }
      };
      
      registerClick();
      console.log(`✅ Captura completa do código: ${refCode}`);
    } else {
      // Verificar se já existe código salvo
      const savedLocalStorage = localStorage.getItem('affiliate_ref');
      const savedCookie = getCookie('affiliate_ref');
      
      if (savedLocalStorage || savedCookie) {
        console.log(`ℹ️ Código já salvo: localStorage=${savedLocalStorage}, cookie=${savedCookie}`);
      }
    }
  }, [searchParams]);

  const getStoredRefCode = (): string | null => {
    const localRef = localStorage.getItem('affiliate_ref');
    const cookieRef = getCookie('affiliate_ref');
    return localRef || cookieRef;
  };

  const clearStoredRefCode = () => {
    localStorage.removeItem('affiliate_ref');
    setCookie('affiliate_ref', '', -1); // Remove cookie
    console.log('🗑️ Código de afiliado removido do armazenamento');
  };

  return {
    getStoredRefCode,
    clearStoredRefCode
  };
};
