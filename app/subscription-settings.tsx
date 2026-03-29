import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { ArrowLeft, Crown, Calendar, CircleAlert as AlertCircle } from 'lucide-react-native';
import { useLanguage } from '@/lib/LanguageContext';
import { supabase } from '@/lib/supabaseClient';

export default function SubscriptionSettingsScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [renewalDate, setRenewalDate] = useState<string>('');

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      console.log('[SubscriptionSettings] Loading subscription data...');
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_subscribed, subscription_started_at, subscription_canceled_at')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) {
          console.error('[SubscriptionSettings] Error loading subscription data:', {
            code: profileError.code,
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint,
          });
          setIsPremium(false);
          return;
        }

        if (profile) {
          console.log('[SubscriptionSettings] Profile data:', profile);
          setIsPremium(profile.is_subscribed || false);

          if (profile.subscription_started_at && !profile.subscription_canceled_at) {
            const startDate = new Date(profile.subscription_started_at);
            const nextMonth = new Date(startDate);
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            setRenewalDate(nextMonth.toLocaleDateString());
          } else if (profile.subscription_canceled_at) {
            const cancelDate = new Date(profile.subscription_canceled_at);
            setRenewalDate(cancelDate.toLocaleDateString());
          } else {
            const nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            setRenewalDate(nextMonth.toLocaleDateString());
          }
        } else {
          console.log('[SubscriptionSettings] No profile found');
        }
      }
    } catch (error) {
      console.error('[SubscriptionSettings] Unexpected error loading subscription data:', error);
    }
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      t.profile.cancelSubscription,
      t.profile.cancelWarning.replace('{date}', renewalDate),
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.profile.confirmCancel,
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              console.log('[SubscriptionSettings] Canceling subscription...');
              const { data: { user } } = await supabase.auth.getUser();

              if (user) {
                const cancelDate = new Date();

                const { error: cancelError } = await supabase
                  .from('profiles')
                  .update({
                    is_subscribed: false,
                    subscription_canceled_at: cancelDate.toISOString(),
                  })
                  .eq('id', user.id);

                if (cancelError) {
                  console.error('[SubscriptionSettings] Error canceling subscription:', {
                    code: cancelError.code,
                    message: cancelError.message,
                    details: cancelError.details,
                    hint: cancelError.hint,
                  });
                  Alert.alert(t.common.error, t.profile.cancelFailed);
                  setLoading(false);
                  return;
                }

                console.log('[SubscriptionSettings] Subscription canceled successfully');
                Alert.alert(
                  t.common.success,
                  t.profile.subscriptionCanceled.replace('{date}', cancelDate.toLocaleDateString())
                );

                await loadSubscriptionData();
              }
            } catch (error) {
              console.error('[SubscriptionSettings] Error canceling subscription:', error);
              Alert.alert(t.common.error, 'Failed to cancel subscription');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#111827" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.profile.subscriptionSettings}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {isPremium ? (
          <>
            <View style={styles.statusCard}>
              <Crown size={48} color="#fbbf24" strokeWidth={2} />
              <Text style={styles.statusTitle}>{t.profile.premiumActive}</Text>
              <Text style={styles.statusSubtitle}>{t.profile.currentPlan}</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.infoRow}>
                <View style={styles.infoLeft}>
                  <Calendar size={20} color="#6b7280" strokeWidth={2} />
                  <Text style={styles.infoLabel}>{t.profile.renewalDate}</Text>
                </View>
                <Text style={styles.infoValue}>{renewalDate}</Text>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoLeft}>
                  <Text style={styles.infoLabel}>Price</Text>
                </View>
                <Text style={styles.infoValue}>5€{t.profile.perMonth}</Text>
              </View>
            </View>

            <View style={styles.noteCard}>
              <AlertCircle size={20} color="#6b7280" strokeWidth={2} />
              <Text style={styles.noteText}>{t.profile.autoRenew}</Text>
            </View>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelSubscription}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>
                {loading ? t.common.loading : t.profile.cancelSubscription}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Crown size={64} color="#9ca3af" strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No Active Subscription</Text>
            <Text style={styles.emptyText}>
              Upgrade to Premium to access all exclusive features
            </Text>
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => router.back()}
            >
              <Text style={styles.upgradeButtonText}>{t.profile.upgradeToPremium}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  statusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 16,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  cancelButton: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  cancelButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  upgradeButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  upgradeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
