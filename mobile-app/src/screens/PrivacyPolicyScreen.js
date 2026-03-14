import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, borderRadius, shadows, spacing, typography } from '../theme';

const POLICY_SECTIONS = [
  {
    title: '1. مقدمة',
    content:
      'تطبيق Rybella Iraq ("التطبيق") يحترم خصوصيتك. توضح هذه السياسة كيفية جمعنا واستخدامنا وحماية بياناتك الشخصية عند استخدام التطبيق.',
  },
  {
    title: '2. البيانات التي نجمعها',
    content:
      'نجمع البيانات التالية عند التسجيل والاستخدام:\n• الاسم والبريد الإلكتروني ورقم الهاتف\n• كلمة المرور (مشفرة)\n• عناوين التوصيل وبيانات الطلبات\n• قائمة الأمنيات وسجل المشتريات',
  },
  {
    title: '3. كيفية استخدام البيانات',
    content:
      'نستخدم بياناتك لـ:\n• تنفيذ الطلبات والتوصيل\n• إدارة حسابك وتفضيلاتك\n• تحسين خدماتنا والتواصل معك\n• الامتثال للقوانين المعمول بها',
  },
  {
    title: '4. حماية البيانات',
    content:
      'نطبق إجراءات أمنية مناسبة لحماية بياناتك من الوصول غير المصرح به أو التعديل أو الإفشاء.',
  },
  {
    title: '5. مشاركة البيانات',
    content:
      'لا نبيع بياناتك الشخصية. قد نشارك بيانات التوصيل مع شركاء التوصيل فقط لتنفيذ الطلبات.',
  },
  {
    title: '6. حقوقك',
    content:
      'يمكنك طلب الوصول أو التصحيح أو حذف بياناتك. يمكنك حذف حسابك من إعدادات التطبيق في أي وقت.',
  },
  {
    title: '7. التحديثات',
    content:
      'قد نحدّث هذه السياسة. سنخطرك بأي تغييرات جوهرية عبر التطبيق أو البريد الإلكتروني.',
  },
  {
    title: '8. التواصل',
    content: 'للاستفسارات حول الخصوصية، تواصل معنا عبر البريد الإلكتروني أو قنوات الدعم المتاحة.',
  },
];

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-forward" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>سياسة الخصوصية</Text>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.appName}>Rybella Iraq</Text>
        <Text style={styles.lastUpdate}>آخر تحديث: مارس 2025</Text>
        {POLICY_SECTIONS.map((section, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingTop: 56,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backBtn: { padding: spacing.sm, marginRight: spacing.md },
  headerTitle: { ...typography.h4, flex: 1, textAlign: 'center' },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  appName: { ...typography.h3, textAlign: 'center', marginBottom: spacing.xs },
  lastUpdate: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.xxl },
  section: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  sectionTitle: { ...typography.h5, marginBottom: spacing.md, color: colors.primary },
  sectionContent: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
    textAlign: 'right',
  },
});
