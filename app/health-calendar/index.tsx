import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, Calendar, Trash2, CreditCard as Edit3, Bell, X } from 'lucide-react-native';
import { useLanguage } from '@/lib/LanguageContext';
import { supabase } from '@/lib/supabaseClient';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '@/lib/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

const isExpoGo = Constants.appOwnership === 'expo';

if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

interface Reminder {
  id: string;
  type: 'vaccination' | 'deworming' | 'vetVisit';
  date: string;
  time: string;
  notes: string;
  notificationId?: string;
}

export default function HealthCalendarScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [selectedType, setSelectedType] = useState<'vaccination' | 'deworming' | 'vetVisit'>('vaccination');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    checkPremiumAndLoadReminders();
    requestNotificationPermissions();
  }, []);

  const requestNotificationPermissions = async () => {
    if (isExpoGo) {
      return;
    }

    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please enable notifications to receive health reminders.');
      }
    } catch (error) {
      console.log('Notification permissions not available in Expo Go');
    }
  };

  const checkPremiumAndLoadReminders = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await loadReminders(user.id);
    }
  };

  const loadReminders = async (userId: string) => {
    const { data, error } = await supabase
      .from('health_reminders')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error loading reminders:', error);
      return;
    }

    setReminders(data || []);
  };

  const scheduleNotification = async (reminder: { type: string; date: Date; time: Date; notes: string }) => {
    if (isExpoGo) {
      return null;
    }

    try {
      const trigger = new Date(reminder.date);
      trigger.setHours(reminder.time.getHours(), reminder.time.getMinutes(), 0);

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: getTypeLabel(reminder.type as any),
          body: reminder.notes || t.healthCalendar.reminderNotification,
          sound: true,
        },
        trigger,
      });

      return notificationId;
    } catch (error) {
      console.log('Could not schedule notification:', error);
      return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'vaccination':
        return t.healthCalendar.vaccination;
      case 'deworming':
        return t.healthCalendar.deworming;
      case 'vetVisit':
        return t.healthCalendar.vetVisit;
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'vaccination':
        return theme.colors.primary;
      case 'deworming':
        return theme.colors.secondary;
      case 'vetVisit':
        return theme.colors.accent;
      default:
        return theme.colors.primary;
    }
  };

  const saveReminder = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const dateStr = selectedDate.toISOString().split('T')[0];
      const timeStr = `${selectedTime.getHours().toString().padStart(2, '0')}:${selectedTime.getMinutes().toString().padStart(2, '0')}`;

      if (editingReminder) {
        await supabase
          .from('health_reminders')
          .update({
            type: selectedType,
            date: dateStr,
            time: timeStr,
            notes: notes,
          })
          .eq('id', editingReminder.id);

        if (editingReminder.notificationId && !isExpoGo) {
          try {
            await Notifications.cancelScheduledNotificationAsync(editingReminder.notificationId);
          } catch (error) {
            console.log('Could not cancel notification');
          }
        }

        const notificationId = await scheduleNotification({
          type: selectedType,
          date: selectedDate,
          time: selectedTime,
          notes,
        });

        if (notificationId) {
          await supabase
            .from('health_reminders')
            .update({ notification_id: notificationId })
            .eq('id', editingReminder.id);
        }
      } else {
        const { data, error } = await supabase
          .from('health_reminders')
          .insert({
            user_id: user.id,
            type: selectedType,
            date: dateStr,
            time: timeStr,
            notes: notes,
          })
          .select()
          .single();

        if (!error && data) {
          const notificationId = await scheduleNotification({
            type: selectedType,
            date: selectedDate,
            time: selectedTime,
            notes,
          });

          if (notificationId) {
            await supabase
              .from('health_reminders')
              .update({ notification_id: notificationId })
              .eq('id', data.id);
          }
        }
      }

      await loadReminders(user.id);
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving reminder:', error);
      Alert.alert(t.common.error, 'Failed to save reminder');
    }
  };

  const deleteReminder = async (reminder: Reminder) => {
    Alert.alert(
      t.common.confirm,
      t.healthCalendar.deleteConfirm,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              if (reminder.notificationId && !isExpoGo) {
                try {
                  await Notifications.cancelScheduledNotificationAsync(reminder.notificationId);
                } catch (error) {
                  console.log('Could not cancel notification');
                }
              }

              await supabase
                .from('health_reminders')
                .delete()
                .eq('id', reminder.id);

              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                await loadReminders(user.id);
              }
            } catch (error) {
              console.error('Error deleting reminder:', error);
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setSelectedType('vaccination');
    setSelectedDate(new Date());
    setSelectedTime(new Date());
    setNotes('');
    setEditingReminder(null);
  };

  const openEditModal = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setSelectedType(reminder.type);
    setSelectedDate(new Date(reminder.date));
    const [hours, minutes] = reminder.time.split(':');
    const timeDate = new Date();
    timeDate.setHours(parseInt(hours), parseInt(minutes));
    setSelectedTime(timeDate);
    setNotes(reminder.notes || '');
    setShowModal(true);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const upcomingReminders = reminders.filter(r => new Date(`${r.date}T${r.time}`) >= new Date());
  const pastReminders = reminders.filter(r => new Date(`${r.date}T${r.time}`) < new Date());

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme.colors.text.primary} strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t.healthCalendar.title}</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          <Plus size={24} color={theme.colors.primary} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {upcomingReminders.length === 0 && pastReminders.length === 0 ? (
          <EmptyState
            icon={<Calendar size={64} color={theme.colors.text.tertiary} strokeWidth={1.5} />}
            title={t.healthCalendar.noReminders}
            description={t.healthCalendar.addFirst}
            action={
              <Button
                title={t.healthCalendar.addReminder}
                onPress={() => {
                  resetForm();
                  setShowModal(true);
                }}
                icon={<Plus size={20} color={theme.colors.text.inverse} />}
              />
            }
          />
        ) : (
          <>
            {upcomingReminders.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t.healthCalendar.upcoming}</Text>
                {upcomingReminders.map((reminder) => (
                  <Card key={reminder.id} variant="elevated" style={styles.reminderCard}>
                    <View style={styles.reminderHeader}>
                      <View style={styles.reminderTypeContainer}>
                        <View style={[styles.typeBadge, { backgroundColor: getTypeColor(reminder.type) + '20' }]}>
                          <Bell size={16} color={getTypeColor(reminder.type)} strokeWidth={2} />
                        </View>
                        <Text style={styles.reminderType}>{getTypeLabel(reminder.type)}</Text>
                      </View>
                      <View style={styles.reminderActions}>
                        <TouchableOpacity onPress={() => openEditModal(reminder)} style={styles.iconButton}>
                          <Edit3 size={18} color={theme.colors.text.secondary} strokeWidth={2} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => deleteReminder(reminder)} style={styles.iconButton}>
                          <Trash2 size={18} color={theme.colors.error} strokeWidth={2} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.reminderBody}>
                      <View style={styles.dateTimeContainer}>
                        <Text style={styles.reminderDate}>{formatDate(reminder.date)}</Text>
                        <View style={styles.timeDot} />
                        <Text style={styles.reminderTime}>{reminder.time}</Text>
                      </View>
                      {reminder.notes && <Text style={styles.reminderNotes}>{reminder.notes}</Text>}
                    </View>
                  </Card>
                ))}
              </View>
            )}

            {pastReminders.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t.healthCalendar.past}</Text>
                {pastReminders.map((reminder) => (
                  <Card key={reminder.id} style={[styles.reminderCard, styles.pastReminderCard]}>
                    <View style={styles.reminderHeader}>
                      <View style={styles.reminderTypeContainer}>
                        <View style={[styles.typeBadge, { backgroundColor: theme.colors.border.light }]}>
                          <Bell size={16} color={theme.colors.text.tertiary} strokeWidth={2} />
                        </View>
                        <Text style={[styles.reminderType, styles.pastText]}>{getTypeLabel(reminder.type)}</Text>
                      </View>
                      <TouchableOpacity onPress={() => deleteReminder(reminder)} style={styles.iconButton}>
                        <Trash2 size={18} color={theme.colors.text.tertiary} strokeWidth={2} />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.reminderBody}>
                      <View style={styles.dateTimeContainer}>
                        <Text style={[styles.reminderDate, styles.pastText]}>{formatDate(reminder.date)}</Text>
                        <View style={[styles.timeDot, styles.pastDot]} />
                        <Text style={[styles.reminderTime, styles.pastText]}>{reminder.time}</Text>
                      </View>
                      {reminder.notes && <Text style={[styles.reminderNotes, styles.pastText]}>{reminder.notes}</Text>}
                    </View>
                  </Card>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingReminder ? t.healthCalendar.editReminder : t.healthCalendar.addReminder}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeButton}>
                <X size={24} color={theme.colors.text.secondary} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>{t.healthCalendar.reminderType}</Text>
              <View style={styles.typeButtons}>
                {(['vaccination', 'deworming', 'vetVisit'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      selectedType === type && styles.typeButtonActive,
                      { borderColor: getTypeColor(type) },
                    ]}
                    onPress={() => setSelectedType(type)}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        selectedType === type && { color: getTypeColor(type) },
                      ]}
                    >
                      {getTypeLabel(type)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>{t.healthCalendar.date}</Text>
              <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                <Calendar size={20} color={theme.colors.text.secondary} />
                <Text style={styles.dateButtonText}>{formatDate(selectedDate.toISOString())}</Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (date) setSelectedDate(date);
                  }}
                />
              )}

              <Text style={styles.label}>{t.healthCalendar.time}</Text>
              <TouchableOpacity style={styles.dateButton} onPress={() => setShowTimePicker(true)}>
                <Bell size={20} color={theme.colors.text.secondary} />
                <Text style={styles.dateButtonText}>
                  {selectedTime.getHours().toString().padStart(2, '0')}:
                  {selectedTime.getMinutes().toString().padStart(2, '0')}
                </Text>
              </TouchableOpacity>

              {showTimePicker && (
                <DateTimePicker
                  value={selectedTime}
                  mode="time"
                  display="default"
                  onChange={(event, date) => {
                    setShowTimePicker(Platform.OS === 'ios');
                    if (date) setSelectedTime(date);
                  }}
                />
              )}

              <Text style={styles.label}>{t.healthCalendar.notes}</Text>
              <TextInput
                style={styles.notesInput}
                placeholder={t.healthCalendar.notesPlaceholder}
                placeholderTextColor={theme.colors.text.tertiary}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title={t.common.cancel}
                onPress={() => setShowModal(false)}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title={editingReminder ? t.common.save : t.common.add}
                onPress={saveReminder}
                style={styles.modalButton}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...theme.typography.h2,
    color: theme.colors.text.primary,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight + '20',
    ...theme.shadows.md,
    borderWidth: 2,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  reminderCard: {
    marginBottom: theme.spacing.md,
  },
  pastReminderCard: {
    opacity: 0.6,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  reminderTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  typeBadge: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.xs,
  },
  reminderType: {
    ...theme.typography.h3,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  reminderActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    ...theme.shadows.xs,
  },
  reminderBody: {
    gap: theme.spacing.sm,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  reminderDate: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  timeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.text.tertiary,
  },
  reminderTime: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
  },
  reminderNotes: {
    ...theme.typography.bodySmall,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  pastText: {
    color: theme.colors.text.tertiary,
  },
  pastDot: {
    backgroundColor: theme.colors.text.tertiary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  modalTitle: {
    ...theme.typography.h2,
    color: theme.colors.text.primary,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: theme.spacing.lg,
    maxHeight: 400,
  },
  label: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  typeButton: {
    flex: 1,
    minWidth: 100,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.border.light,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: theme.colors.primaryLight + '10',
  },
  typeButtonText: {
    ...theme.typography.bodySmall,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  dateButtonText: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
  },
  notesInput: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    ...theme.typography.body,
    color: theme.colors.text.primary,
    minHeight: 100,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  modalButton: {
    flex: 1,
  },
});
