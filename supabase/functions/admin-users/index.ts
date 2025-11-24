import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!isAdmin) {
      throw new Error('Forbidden: Admin access required');
    }

    const { action, userId } = await req.json();

    if (action === 'list') {
      console.log('Fetching all users...');
      
      // Get all auth users
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error('Error fetching auth users:', authError);
        throw authError;
      }

      console.log(`Found ${authData.users.length} auth users`);

      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      console.log(`Found ${profiles?.length || 0} profiles`);

      // Get all roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
        throw rolesError;
      }

      console.log(`Found ${roles?.length || 0} role assignments`);

      // Combine all data from auth.users
      const users = authData.users.map(authUser => {
        const profile = profiles?.find(p => p.id === authUser.id);
        const isAdmin = roles?.some(r => r.user_id === authUser.id && r.role === 'admin') || false;
        
        return {
          id: authUser.id,
          email: authUser.email || 'Sem email',
          created_at: authUser.created_at,
          is_vip: profile?.is_vip || false,
          vip_expires_at: profile?.vip_expires_at || null,
          is_admin: isAdmin,
          is_affiliate: profile?.is_affiliate || false,
          affiliate_code: profile?.affiliate_code || null
        };
      });

      console.log(`Returning ${users.length} users`);

      return new Response(
        JSON.stringify({ users }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'toggle_admin') {
      if (!userId) throw new Error('User ID is required');

      // Check if user has admin role
      const { data: hasAdminRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .single();

      if (hasAdminRole) {
        // Remove admin role
        const { error: deleteError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');

        if (deleteError) throw deleteError;
      } else {
        // Add admin role
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'admin' });

        if (insertError) throw insertError;
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'grant_vip') {
      if (!userId) throw new Error('User ID is required');

      // Get VIP duration from settings
      const { data: settings, error: settingsError } = await supabase
        .from('vip_settings')
        .select('vip_duration_days')
        .single();

      if (settingsError) throw settingsError;

      const durationDays = settings.vip_duration_days || 30;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + durationDays);

      // Update user profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          is_vip: true,
          vip_expires_at: expiresAt.toISOString(),
          vip_created_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Log the action
      await supabase
        .from('vip_logs')
        .insert({
          user_id: userId,
          action: 'grant_vip_by_admin',
          details: { admin_id: user.id, duration_days: durationDays }
        });

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'toggle_affiliate') {
      if (!userId) throw new Error('User ID is required');

      // Get current profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_affiliate, affiliate_code')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      if (profile.is_affiliate) {
        // Remove affiliate status
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            is_affiliate: false
          })
          .eq('id', userId);

        if (updateError) throw updateError;
      } else {
        // Generate affiliate code if doesn't exist
        let affiliateCode = profile.affiliate_code;
        
        if (!affiliateCode) {
          const { data: newCode, error: codeError } = await supabase
            .rpc('generate_affiliate_code');
          
          if (codeError) throw codeError;
          affiliateCode = newCode;
        }

        // Add affiliate status
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            is_affiliate: true,
            affiliate_code: affiliateCode,
            affiliate_balance: 0
          })
          .eq('id', userId);

        if (updateError) throw updateError;
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Error in admin-users:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
