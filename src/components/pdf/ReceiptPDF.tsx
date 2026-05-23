import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { maskCpfPartially } from '../../utils/mask';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', color: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40, borderBottom: '2 solid #000', paddingBottom: 20 },
  headerLeft: { flex: 1 },
  headerRight: { alignItems: 'flex-end' },
  logoText: { fontSize: 20, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2 },
  receiptTitle: { fontSize: 24, fontWeight: 'bold', textTransform: 'uppercase', color: '#333', marginBottom: 5 },
  receiptNumber: { fontSize: 10, color: '#666' },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', color: '#666', borderBottom: '1 solid #eee', paddingBottom: 5, marginBottom: 10 },
  row: { flexDirection: 'row', marginBottom: 5, fontSize: 11 },
  label: { width: 120, color: '#666' },
  value: { flex: 1, fontWeight: 'bold' },
  amountBox: { backgroundColor: '#f8f9fa', padding: 20, alignItems: 'center', marginTop: 20, borderRadius: 4 },
  amountText: { fontSize: 28, fontWeight: 'bold' },
  amountLabel: { fontSize: 10, textTransform: 'uppercase', color: '#666', marginTop: 5 },
  footer: { position: 'absolute', bottom: 40, left: 40, right: 40 },
  signatureContainer: { alignItems: 'center', marginTop: 20 },
  signatureLine: { width: 200, borderTop: '1 solid #000', marginBottom: 10 },
  signatureName: { fontSize: 12, fontWeight: 'bold' },
  footerText: { fontSize: 8, color: '#999', textAlign: 'center', marginTop: 30 }
});

export interface ReceiptProps {
  receiptNumber: string;
  issuedAt: string;
  paymentMethod: string;
  amount: number;
  issuedBy: string;
  clientName: string;
  clientCpf?: string;
  packageName: string;
}

export const ReceiptPDF = (props: ReceiptProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.logoText}>Andrea Fontes</Text>
          <Text style={{ fontSize: 10, color: '#666', marginTop: 4 }}>Estúdio Fotográfico</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.receiptTitle}>Recibo</Text>
          <Text style={styles.receiptNumber}>Nº {props.receiptNumber}</Text>
          <Text style={styles.receiptNumber}>Data: {props.issuedAt}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dados do Cliente</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Nome:</Text>
          <Text style={styles.value}>{props.clientName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>CPF:</Text>
          <Text style={styles.value}>{maskCpfPartially(props.clientCpf)}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Detalhes do Serviço</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Referente a:</Text>
          <Text style={styles.value}>{props.packageName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Pagamento:</Text>
          <Text style={styles.value}>{props.paymentMethod}</Text>
        </View>
      </View>

      <View style={styles.amountBox}>
        <Text style={styles.amountText}>
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(props.amount)}
        </Text>
        <Text style={styles.amountLabel}>Valor Recebido</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.signatureContainer}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureName}>{props.issuedBy}</Text>
          <Text style={{ fontSize: 9, color: '#666', marginTop: 2 }}>Estúdio Fotográfico Andrea Fontes</Text>
        </View>
        <Text style={styles.footerText}>
          Este recibo comprova o pagamento do valor especificado para os serviços descritos.
          Documento gerado digitalmente.
        </Text>
      </View>
    </Page>
  </Document>
);
