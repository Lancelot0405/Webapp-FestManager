import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import { Download } from 'lucide-react';
import type { FestivalEvent } from '../../types';

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica', fontSize: 10, color: '#1f2937' },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 4, color: '#1d4ed8' },
  subtitle: { fontSize: 10, color: '#6b7280', marginBottom: 20 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', color: '#374151', marginBottom: 8, borderBottom: '1px solid #e5e7eb', paddingBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { color: '#6b7280' },
  value: { fontWeight: 'bold' },
  staffItem: { marginBottom: 3, color: '#374151' },
  positive: { color: '#16a34a', fontWeight: 'bold' },
  negative: { color: '#dc2626', fontWeight: 'bold' },
});

function EventDocument({ event }: { event: FestivalEvent }) {
  const totalExpense = Object.values(event.financials.expenses).reduce<number>((s, v) => s + (v ?? 0), 0);
  const profit = event.financials.income - totalExpense;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{event.name}</Text>
        <Text style={styles.subtitle}>Bao cao su kien · FestManager</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thong tin chung</Text>
          <View style={styles.row}><Text style={styles.label}>Ngay:</Text><Text style={styles.value}>{event.date}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Dia diem:</Text><Text style={styles.value}>{event.location}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Trang thai:</Text><Text style={styles.value}>{event.status}</Text></View>
          {event.extra.booth && <View style={styles.row}><Text style={styles.label}>Quay hang:</Text><Text style={styles.value}>{event.extra.booth}</Text></View>}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tai chinh</Text>
          <View style={styles.row}><Text style={styles.label}>Doanh thu:</Text><Text style={[styles.value, styles.positive]}>{event.financials.income.toLocaleString('fr-FR')}EUR</Text></View>
          <View style={styles.row}><Text style={styles.label}>Tong chi phi:</Text><Text style={[styles.value, styles.negative]}>{totalExpense.toLocaleString('fr-FR')}EUR</Text></View>
          <View style={styles.row}><Text style={styles.label}>Loi nhuan:</Text><Text style={[styles.value, profit >= 0 ? styles.positive : styles.negative]}>{profit.toLocaleString('fr-FR')}EUR</Text></View>
          {Object.entries(event.financials.expenses).map(([key, val]) => (
            <View key={key} style={styles.row}>
              <Text style={styles.label}>  · {key}:</Text>
              <Text>{(val ?? 0).toLocaleString('fr-FR')}EUR</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nhan su ({event.staff.length} nguoi)</Text>
          {event.staff.map(s => (
            <Text key={s.id} style={styles.staffItem}>· {s.name} ({s.city})</Text>
          ))}
        </View>
      </Page>
    </Document>
  );
}

interface Props { event: FestivalEvent; }

export default function EventPDFExport({ event }: Props) {
  return (
    <PDFDownloadLink
      document={<EventDocument event={event} />}
      fileName={`${event.name.replace(/\s+/g, '_')}_report.pdf`}
    >
      {({ loading }) => (
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border border-gray-200 bg-white text-red-600 hover:bg-red-50 transition-colors"
          title="Xuat PDF"
        >
          <Download size={15} />
          {loading ? '...' : 'PDF'}
        </button>
      )}
    </PDFDownloadLink>
  );
}
